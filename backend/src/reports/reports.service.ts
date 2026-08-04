import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { round2, round3, toNumber } from '../common/decimal';
import {
  CommercialStream,
  SaleStatus,
  SalesChannel,
} from '../common/enums';
import { Sale } from '../sales/sale.entity';
import { Station } from '../stations/station.entity';
import { FinanceService } from '../finance/finance.service';
import { PaycService } from '../payc/payc.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale) private readonly salesRepo: Repository<Sale>,
    @InjectRepository(Station) private readonly stationsRepo: Repository<Station>,
    private readonly financeService: FinanceService,
    private readonly paycService: PaycService,
  ) {}

  async executiveSummary() {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const now = new Date();

    const sales = await this.salesRepo.find({
      where: {
        soldAt: Between(monthStart, now),
        status: SaleStatus.COMPLETED,
      },
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
    for (const ch of Object.values(SalesChannel)) {
      byChannel[ch] = 0;
    }
    for (const sale of sales) {
      const ch = sale.salesChannel ?? SalesChannel.RETAIL_LIST;
      byChannel[ch] += toNumber(sale.totalAmount);
    }

    const totalKg = round3(sales.reduce((s, x) => s + toNumber(x.lpgQuantityKg), 0));
    const totalRev = round2(sales.reduce((s, x) => s + toNumber(x.totalAmount), 0));
    const grossMarginPerKg =
      totalKg > 0 ? round2((totalRev - totalKg * 1200) / totalKg) : 0;

    const stations = await this.stationsRepo.find();
    const franchiseCount = stations.filter((s) => s.isFranchise).length;

    const payc = await this.paycService.dashboard();
    const budget = await this.financeService.budgetVsActual(
      now.getFullYear(),
      now.getMonth() + 1,
    );

    return {
      charterPhase: 1,
      commercialStreams: byStream,
      salesByChannel: byChannel,
      grossMarginPerKg,
      totalRevenueMonth: totalRev,
      totalKgMonth: totalKg,
      franchiseOutlets: franchiseCount,
      ownedStations: stations.length - franchiseCount,
      paycSummary: {
        meters: payc.totalMeters,
        deferredRevenue: payc.totalDeferredRevenue,
        dailyBurnKg: payc.dailyBurnKg,
      },
      budgetVsActual: budget,
      moduleStatus: [
        { module: 'Core Financials (GL)', status: 'ACTIVE', phase: 1 },
        { module: 'Sales Management', status: 'ACTIVE', phase: 1 },
        { module: 'Inventory & Gas Loss', status: 'ACTIVE', phase: 1 },
        { module: 'PAYC & IoT', status: 'INTEGRATION_STUB', phase: 2 },
        { module: 'Procurement & Landed Cost', status: 'ACTIVE', phase: 1 },
        { module: 'Expense & Cash', status: 'ACTIVE', phase: 1 },
        { module: 'Budgeting & BI', status: 'PARTIAL', phase: 1 },
        { module: 'Asset Management (CMMS)', status: 'PARTIAL', phase: 2 },
        { module: 'Capital Projects', status: 'PLANNED', phase: 3 },
        { module: 'Accessories & Merchandising', status: 'ACTIVE', phase: 1 },
      ],
    };
  }
}
