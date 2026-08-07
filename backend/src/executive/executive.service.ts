import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { round2, round3, toNumber } from '../common/decimal';
import { SaleStatus } from '../common/enums';
import { ActionCentreService } from '../action-centre/action-centre.service';
import { ReportsService } from '../reports/reports.service';
import { Sale } from '../sales/sale.entity';
import { Station } from '../stations/station.entity';
import { TanksService } from '../tanks/tanks.service';

@Injectable()
export class ExecutiveService {
  constructor(
    @InjectRepository(Sale) private readonly salesRepo: Repository<Sale>,
    @InjectRepository(Station) private readonly stationsRepo: Repository<Station>,
    private readonly reportsService: ReportsService,
    private readonly actionCentre: ActionCentreService,
    private readonly tanksService: TanksService,
  ) {}

  async overview() {
    const base = await this.reportsService.executiveSummary();
    const actionItems = await this.actionCentre.summary();
    const runout = await this.tanksService.runoutForecast();
    return {
      ...base,
      actionCentre: actionItems,
      stockoutRisk: runout.filter((r) => r.daysToRunout <= 3).length,
      runoutAlerts: runout.slice(0, 5),
    };
  }

  async stationRankings(metric = 'revenue') {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const sales = await this.salesRepo.find({
      where: { soldAt: Between(start, new Date()), status: SaleStatus.COMPLETED },
      relations: { station: true },
    });

    const byStation: Record<
      string,
      { stationId: string; code: string; name: string; revenue: number; kg: number; count: number }
    > = {};

    for (const sale of sales) {
      const id = sale.stationId;
      if (!byStation[id]) {
        byStation[id] = {
          stationId: id,
          code: sale.station?.code ?? id,
          name: sale.station?.name ?? '',
          revenue: 0,
          kg: 0,
          count: 0,
        };
      }
      byStation[id].revenue += toNumber(sale.totalAmount);
      byStation[id].kg += toNumber(sale.lpgQuantityKg);
      byStation[id].count += 1;
    }

    const rows = Object.values(byStation).map((s) => ({
      ...s,
      revenue: round2(s.revenue),
      kg: round3(s.kg),
      avgTicket: s.count > 0 ? round2(s.revenue / s.count) : 0,
      marginPerKg: s.kg > 0 ? round2((s.revenue - s.kg * 1200) / s.kg) : 0,
    }));

    const sortKey =
      metric === 'kg' ? 'kg' : metric === 'margin' ? 'marginPerKg' : 'revenue';
    rows.sort((a, b) => (b[sortKey as keyof typeof b] as number) - (a[sortKey as keyof typeof a] as number));

    return { metric, rankings: rows };
  }

  async exceptions() {
    const runout = await this.tanksService.runoutForecast();
    const action = await this.actionCentre.summary();
    return {
      lowStock: runout.filter((r) => r.daysToRunout <= 7),
      actionItems: action.items,
    };
  }
}
