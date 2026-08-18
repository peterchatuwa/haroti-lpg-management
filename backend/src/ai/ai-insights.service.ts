import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { round2, round3, toNumber } from '../common/decimal';
import {
  AnomalyCategory,
  AnomalySeverity,
  DeliveryStatus,
  SaleStatus,
  ShiftStatus,
  StockMovementType,
} from '../common/enums';
import { Delivery } from '../deliveries/delivery.entity';
import { StockMovement } from '../inventory/stock-movement.entity';
import { LossCase } from '../tanks/loss-case.entity';
import { Sale } from '../sales/sale.entity';
import { Shift } from '../shifts/shift.entity';
import { Station } from '../stations/station.entity';
import { TanksService } from '../tanks/tanks.service';
import { JwtPayload } from '../auth/jwt-payload';

export interface DemandForecastRow {
  stationId: string;
  stationCode: string;
  forecastDate: string;
  predictedKg: number;
  lowerKg: number;
  upperKg: number;
  confidencePct: number;
  modelDate: string;
}

export interface AnomalyFlag {
  id: string;
  category: AnomalyCategory;
  severity: AnomalySeverity;
  title: string;
  detail: string;
  stationCode?: string;
  detectedAt: string;
}

@Injectable()
export class AiInsightsService {
  constructor(
    @InjectRepository(Sale) private readonly salesRepo: Repository<Sale>,
    @InjectRepository(Shift) private readonly shiftsRepo: Repository<Shift>,
    @InjectRepository(StockMovement)
    private readonly movementsRepo: Repository<StockMovement>,
    @InjectRepository(LossCase) private readonly lossRepo: Repository<LossCase>,
    @InjectRepository(Delivery)
    private readonly deliveriesRepo: Repository<Delivery>,
    @InjectRepository(Station)
    private readonly stationsRepo: Repository<Station>,
    private readonly tanksService: TanksService,
  ) {}

  async demandForecast(days = 7) {
    const stations = await this.stationsRepo.find({
      where: { status: 'ACTIVE' as never },
    });
    const since = new Date();
    since.setDate(since.getDate() - 56);
    const modelDate = new Date().toISOString().slice(0, 10);
    const rows: DemandForecastRow[] = [];

    for (const station of stations) {
      const sales = await this.salesRepo.find({
        where: {
          stationId: station.id,
          status: SaleStatus.COMPLETED,
          soldAt: Between(since, new Date()),
        },
      });

      const byDow: number[] = Array.from({ length: 7 }, () => 0);
      const dowCount: number[] = Array.from({ length: 7 }, () => 0);
      for (const sale of sales) {
        const dow = sale.soldAt.getDay();
        byDow[dow] += toNumber(sale.lpgQuantityKg);
        dowCount[dow] += 1;
      }

      const overallAvg =
        sales.length > 0
          ? sales.reduce((s, x) => s + toNumber(x.lpgQuantityKg), 0) / 56
          : 0;

      for (let d = 0; d < days; d++) {
        const date = new Date();
        date.setDate(date.getDate() + d + 1);
        const dow = date.getDay();
        const dowAvg =
          dowCount[dow] > 0
            ? byDow[dow] / Math.max(dowCount[dow], 1)
            : overallAvg;
        const predicted = round3(dowAvg * 0.7 + overallAvg * 0.3);
        const band = round3(predicted * 0.15);

        rows.push({
          stationId: station.id,
          stationCode: station.code,
          forecastDate: date.toISOString().slice(0, 10),
          predictedKg: predicted,
          lowerKg: round3(Math.max(0, predicted - band)),
          upperKg: round3(predicted + band),
          confidencePct: sales.length >= 28 ? 85 : sales.length >= 14 ? 70 : 55,
          modelDate,
        });
      }
    }

    return rows;
  }

  async stockoutRisk() {
    const forecast = await this.demandForecast(7);
    const runout = await this.tanksService.runoutForecast();
    const inbound = await this.deliveriesRepo.find({
      where: {
        status: DeliveryStatus.SUPPLIER_DISPATCH,
      },
      relations: { station: true },
    });

    const byStation: Record<
      string,
      {
        stationCode: string;
        currentStockKg: number;
        daysToRunout: number;
        forecast7dKg: number;
        inboundKg: number;
        riskScore: number;
      }
    > = {};

    for (const row of forecast) {
      if (!byStation[row.stationId]) {
        const r = runout.find((x) => x.stationId === row.stationId);
        byStation[row.stationId] = {
          stationCode: row.stationCode,
          currentStockKg: r?.currentStockKg ?? 0,
          daysToRunout: r?.daysToRunout ?? 999,
          forecast7dKg: 0,
          inboundKg: 0,
          riskScore: 0,
        };
      }
      byStation[row.stationId].forecast7dKg += row.predictedKg;
    }

    for (const del of inbound) {
      if (!byStation[del.stationId]) continue;
      byStation[del.stationId].inboundKg += toNumber(del.quantityDispatchedKg);
    }

    return Object.entries(byStation)
      .map(([stationId, s]) => {
        const coverDays =
          s.forecast7dKg > 0
            ? (s.currentStockKg + s.inboundKg) / (s.forecast7dKg / 7)
            : 999;
        const riskScore = round2(
          Math.max(0, 100 - Math.min(coverDays, 14) * 7),
        );
        return { stationId, ...s, coverDays: round2(coverDays), riskScore };
      })
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  async detectAnomalies(stationId?: string) {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const flags: AnomalyFlag[] = [];

    const lossCases = await this.lossRepo.find({
      where: stationId ? { stationId } : {},
      relations: { station: true },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    for (const c of lossCases) {
      if (toNumber(c.variancePercent) >= 2) {
        flags.push({
          id: c.id,
          category: AnomalyCategory.GAS_LOSS,
          severity:
            toNumber(c.variancePercent) >= 5
              ? AnomalySeverity.HIGH
              : AnomalySeverity.MEDIUM,
          title: `Gas loss case ${c.caseNumber}`,
          detail: `Variance ${c.variancePercent}% at ${c.station?.code ?? 'station'}`,
          stationCode: c.station?.code,
          detectedAt: c.createdAt.toISOString(),
        });
      }
    }

    const sales = await this.salesRepo.find({
      where: {
        soldAt: Between(since, new Date()),
        status: SaleStatus.COMPLETED,
        ...(stationId ? { stationId } : {}),
      },
      relations: { station: true, attendant: true },
    });

    const discounts = sales.filter((s) => toNumber(s.discountAmount) > 5000);
    for (const s of discounts.slice(0, 10)) {
      flags.push({
        id: s.id,
        category: AnomalyCategory.DISCOUNT,
        severity: AnomalySeverity.MEDIUM,
        title: `Large discount on ${s.receiptNumber}`,
        detail: `MWK ${s.discountAmount} discount by ${s.attendant?.fullName ?? 'attendant'}`,
        stationCode: s.station?.code,
        detectedAt: s.soldAt.toISOString(),
      });
    }

    const voids = await this.salesRepo.find({
      where: {
        soldAt: Between(since, new Date()),
        status: SaleStatus.VOIDED,
        ...(stationId ? { stationId } : {}),
      },
      relations: { station: true },
      take: 10,
    });
    for (const s of voids) {
      flags.push({
        id: s.id,
        category: AnomalyCategory.REFUND,
        severity: AnomalySeverity.LOW,
        title: `Voided sale ${s.receiptNumber}`,
        detail: `Void at ${s.station?.code ?? 'station'}`,
        stationCode: s.station?.code,
        detectedAt: s.soldAt.toISOString(),
      });
    }

    const adjustments = await this.movementsRepo.find({
      where: {
        type: StockMovementType.STOCK_ADJUSTMENT,
        ...(stationId ? { stationId } : {}),
      },
      relations: { station: true },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    for (const m of adjustments) {
      if (Math.abs(toNumber(m.quantityKg)) >= 50) {
        flags.push({
          id: m.id,
          category: AnomalyCategory.STOCK_ADJUST,
          severity: AnomalySeverity.HIGH,
          title: `Large stock adjustment`,
          detail: `${m.quantityKg} kg at ${m.station?.code ?? 'station'}`,
          stationCode: m.station?.code,
          detectedAt: m.createdAt.toISOString(),
        });
      }
    }

    const shifts = await this.shiftsRepo.find({
      where: {
        closedAt: Between(since, new Date()),
        status: ShiftStatus.PENDING_APPROVAL,
        ...(stationId ? { stationId } : {}),
      },
      relations: { station: true },
      take: 10,
    });
    for (const sh of shifts) {
      const variance = toNumber(sh.cashVariance ?? 0);
      if (Math.abs(variance) >= 10000) {
        flags.push({
          id: sh.id,
          category: AnomalyCategory.CASH_VARIANCE,
          severity: AnomalySeverity.HIGH,
          title: `Cash variance on shift`,
          detail: `MWK ${variance} at ${sh.station?.code ?? 'station'}`,
          stationCode: sh.station?.code,
          detectedAt: (sh.closedAt ?? sh.createdAt).toISOString(),
        });
      }
    }

    return flags.sort(
      (a, b) =>
        new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
    );
  }

  async naturalLanguageQuery(question: string, user: JwtPayload) {
    const q = question.toLowerCase();
    const stationId = user.stationId ?? undefined;

    if (q.includes('loss') || q.includes('variance')) {
      const flags = await this.detectAnomalies(stationId);
      const loss = flags.filter((f) => f.category === AnomalyCategory.GAS_LOSS);
      return {
        question,
        answer: loss.length
          ? `Found ${loss.length} gas loss anomaly(ies). Highest: ${loss[0].title} — ${loss[0].detail}.`
          : 'No significant gas loss anomalies in the last 7 days.',
        citations: loss.slice(0, 5),
        readOnly: true,
      };
    }

    if (q.includes('stockout') || q.includes('runout') || q.includes('stock')) {
      const risk = await this.stockoutRisk();
      const top = risk.slice(0, 3);
      return {
        question,
        answer: top.length
          ? `Top stockout risk: ${top.map((r) => `${r.stationCode} (score ${r.riskScore})`).join(', ')}.`
          : 'All stations appear adequately stocked.',
        citations: top,
        readOnly: true,
      };
    }

    if (q.includes('forecast') || q.includes('demand')) {
      const forecast = await this.demandForecast(3);
      const scoped = stationId
        ? forecast.filter((f) => f.stationId === stationId)
        : forecast;
      const total = round3(scoped.reduce((s, f) => s + f.predictedKg, 0));
      return {
        question,
        answer: `Predicted demand next 3 days: ${total} kg across ${new Set(scoped.map((f) => f.stationId)).size} station(s).`,
        citations: scoped.slice(0, 6),
        readOnly: true,
      };
    }

    if (q.includes('discount')) {
      const flags = await this.detectAnomalies(stationId);
      const disc = flags.filter((f) => f.category === AnomalyCategory.DISCOUNT);
      return {
        question,
        answer: disc.length
          ? `${disc.length} unusual discount(s) this week. Latest: ${disc[0].detail}.`
          : 'No unusual discounts detected this week.',
        citations: disc.slice(0, 5),
        readOnly: true,
      };
    }

    const risk = await this.stockoutRisk();
    return {
      question,
      answer:
        'I can help with gas loss, stockout risk, demand forecasts, and discount anomalies. Try asking e.g. "Which station has the highest stockout risk?"',
      citations: risk.slice(0, 3),
      readOnly: true,
    };
  }
}
