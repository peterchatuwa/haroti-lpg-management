import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { round2, round3, toNumber } from '../common/decimal';
import {
  CommercialStream,
  SaleStatus,
  SalesChannel,
  WorkOrderStatus,
} from '../common/enums';
import { FinanceService } from '../finance/finance.service';
import { MaintenanceWorkOrder } from '../maintenance/work-order.entity';
import { PaycService } from '../payc/payc.service';
import { ProjectsService } from '../projects/projects.service';
import { FranchiseService } from '../franchise/franchise.service';
import { Sale } from '../sales/sale.entity';
import { Station } from '../stations/station.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale) private readonly salesRepo: Repository<Sale>,
    @InjectRepository(Station) private readonly stationsRepo: Repository<Station>,
    @InjectRepository(MaintenanceWorkOrder)
    private readonly woRepo: Repository<MaintenanceWorkOrder>,
    private readonly financeService: FinanceService,
    private readonly paycService: PaycService,
    private readonly projectsService: ProjectsService,
    private readonly franchiseService: FranchiseService,
  ) {}

  private monthRange() {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { start, end: new Date() };
  }

  async executiveSummary() {
    const { start, end } = this.monthRange();
    const sales = await this.salesRepo.find({
      where: { soldAt: Between(start, end), status: SaleStatus.COMPLETED },
      relations: { station: true },
    });

    const byStream: Record<string, { revenue: number; kg: number; count: number }> =
      {};
    for (const stream of Object.values(CommercialStream)) {
      byStream[stream] = { revenue: 0, kg: 0, count: 0 };
    }
    for (const sale of sales) {
      const stream = sale.commercialStream ?? CommercialStream.RETAIL_FORECOURT;
      byStream[stream].revenue += toNumber(sale.totalAmount);
      byStream[stream].kg += toNumber(sale.lpgQuantityKg);
      byStream[stream].count += 1;
    }

    const byChannel: Record<string, number> = {};
    for (const ch of Object.values(SalesChannel)) byChannel[ch] = 0;
    for (const sale of sales) {
      byChannel[sale.salesChannel ?? SalesChannel.RETAIL_LIST] += toNumber(
        sale.totalAmount,
      );
    }

    const totalKg = round3(sales.reduce((s, x) => s + toNumber(x.lpgQuantityKg), 0));
    const totalRev = round2(sales.reduce((s, x) => s + toNumber(x.totalAmount), 0));
    const grossMarginPerKg =
      totalKg > 0 ? round2((totalRev - totalKg * 1200) / totalKg) : 0;

    const stations = await this.stationsRepo.find();
    const payc = await this.paycService.dashboard();
    const budget = await this.financeService.budgetVsActual(
      end.getFullYear(),
      end.getMonth() + 1,
    );
    const projects = await this.projectsService.portfolioSummary();
    const openWo = await this.woRepo.count({
      where: [{ status: WorkOrderStatus.OPEN }, { status: WorkOrderStatus.IN_PROGRESS }],
    });

    return {
      charterPhase: 3,
      commercialStreams: byStream,
      salesByChannel: byChannel,
      grossMarginPerKg,
      totalRevenueMonth: totalRev,
      totalKgMonth: totalKg,
      franchiseOutlets: stations.filter((s) => s.isFranchise).length,
      ownedStations: stations.filter((s) => !s.isFranchise).length,
      paycSummary: {
        meters: payc.totalMeters,
        deferredRevenue: payc.totalDeferredRevenue,
        dailyBurnKg: payc.dailyBurnKg,
        alerts: payc.alerts?.length ?? 0,
      },
      cmmsSummary: { openWorkOrders: openWo },
      projectsSummary: {
        active: projects.active,
        totalBudget: projects.totalBudget,
        totalSpent: projects.totalSpent,
      },
      budgetVsActual: budget,
      moduleStatus: [
        { module: 'Core Financials (GL)', status: 'ACTIVE', phase: 1 },
        { module: 'Sales Management', status: 'ACTIVE', phase: 1 },
        { module: 'Inventory & Gas Loss', status: 'ACTIVE', phase: 1 },
        { module: 'PAYC & IoT', status: 'ACTIVE', phase: 2 },
        { module: 'Procurement & Landed Cost', status: 'ACTIVE', phase: 1 },
        { module: 'Expense & Cash', status: 'ACTIVE', phase: 1 },
        { module: 'Budgeting & BI', status: 'ACTIVE', phase: 3 },
        { module: 'Asset Management (CMMS)', status: 'ACTIVE', phase: 2 },
        { module: 'Capital Projects', status: 'ACTIVE', phase: 3 },
        { module: 'Franchise & Agent API', status: 'ACTIVE', phase: 3 },
        { module: 'Accessories & Merchandising', status: 'ACTIVE', phase: 1 },
      ],
    };
  }

  async stationProfitability() {
    const { start, end } = this.monthRange();
    const sales = await this.salesRepo.find({
      where: { soldAt: Between(start, end), status: SaleStatus.COMPLETED },
    });
    const stations = await this.stationsRepo.find();

    return stations.map((st) => {
      const stSales = sales.filter((s) => s.stationId === st.id);
      const revenue = round2(
        stSales.reduce((sum, s) => sum + toNumber(s.totalAmount), 0),
      );
      const kg = round3(
        stSales.reduce((sum, s) => sum + toNumber(s.lpgQuantityKg), 0),
      );
      const cogs = round2(kg * 1200);
      return {
        code: st.code,
        name: st.name,
        isFranchise: st.isFranchise,
        revenue,
        kgSold: kg,
        estimatedCogs: cogs,
        grossProfit: round2(revenue - cogs),
        transactions: stSales.length,
        currentStockKg: toNumber(st.currentStockKg),
      };
    });
  }

  async revenueTrend(days = 14) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const sales = await this.salesRepo.find({
      where: { soldAt: Between(start, end), status: SaleStatus.COMPLETED },
    });

    const byDay: Record<string, number> = {};
    for (let i = 0; i <= days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      byDay[d.toISOString().slice(0, 10)] = 0;
    }
    for (const sale of sales) {
      const key = new Date(sale.soldAt).toISOString().slice(0, 10);
      if (key in byDay) byDay[key] += toNumber(sale.totalAmount);
    }

    return Object.entries(byDay).map(([date, revenue]) => ({
      date,
      revenue: round2(revenue),
    }));
  }

  async cashFlowForecast() {
    const { start, end } = this.monthRange();
    const sales = await this.salesRepo.find({
      where: { soldAt: Between(start, end), status: SaleStatus.COMPLETED },
    });
    const payc = await this.paycService.dashboard();
    const projects = await this.projectsService.portfolioSummary();

    const monthRevenue = round2(
      sales.reduce((s, x) => s + toNumber(x.totalAmount), 0),
    );
    const dailyAvg = round2(monthRevenue / Math.max(end.getDate(), 1));
    const paycDaily = payc.estimatedDailyRevenue;

    return {
      monthToDateRevenue: monthRevenue,
      dailyAverageRevenue: dailyAvg,
      projectedMonthEnd: round2(dailyAvg * 30),
      paycDailyBurnRevenue: paycDaily,
      deferredPaycLiability: payc.totalDeferredRevenue,
      capexCommitted: projects.totalSpent,
      capexRemaining: round2(projects.totalBudget - projects.totalSpent),
    };
  }

  async franchiseReport() {
    const agreements = await this.franchiseService.listAgreements();
    const settlements = await this.franchiseService.listSettlements();
    const commissions = await this.franchiseService.listAgentCommissions();

    return {
      agreements: agreements.length,
      pendingSettlements: settlements.filter((s) => s.status !== 'PAID').length,
      totalRoyaltyDue: round2(
        settlements.reduce((sum, s) => sum + toNumber(s.royaltyDue), 0),
      ),
      agentCommissionsAccrued: round2(
        commissions.reduce((sum, c) => sum + toNumber(c.commissionAmount), 0),
      ),
      outlets: agreements.map((a) => ({
        code: a.station?.code,
        name: a.franchiseName,
        royaltyPercent: toNumber(a.royaltyPercent),
      })),
    };
  }
}
