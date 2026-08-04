import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, round2, round3, toNumber } from '../common/decimal';
import { PaycMeterStatus, JournalEventType } from '../common/enums';
import { FinanceService, GL_ACCOUNTS } from '../finance/finance.service';
import { PaycMeter } from './payc-meter.entity';

@Injectable()
export class PaycService {
  constructor(
    @InjectRepository(PaycMeter)
    private readonly metersRepo: Repository<PaycMeter>,
    private readonly financeService: FinanceService,
  ) {}

  findAll() {
    return this.metersRepo.find({
      relations: { customer: true, station: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async dashboard() {
    const meters = await this.findAll();
    const active = meters.filter((m) => m.status === PaycMeterStatus.ACTIVE);
    const offline = meters.filter((m) => m.status === PaycMeterStatus.OFFLINE);
    const lowCredit = meters.filter(
      (m) => m.status === PaycMeterStatus.LOW_CREDIT,
    );
    const totalDeferred = round2(
      meters.reduce((s, m) => s + toNumber(m.deferredRevenue), 0),
    );
    const totalCreditKg = round3(
      meters.reduce((s, m) => s + toNumber(m.creditBalanceKg), 0),
    );
    const dailyBurn = round3(
      meters.reduce((s, m) => s + toNumber(m.dailyBurnKg), 0),
    );

    return {
      totalMeters: meters.length,
      activeMeters: active.length,
      offlineMeters: offline.length,
      lowCreditMeters: lowCredit.length,
      totalDeferredRevenue: totalDeferred,
      totalCreditKg,
      estimatedDailyRevenue: round2(dailyBurn * 1850),
      dailyBurnKg: dailyBurn,
      meters: meters.slice(0, 20),
    };
  }

  /** Simulated IoT telemetry ingest (Charter Module 4). */
  async ingestTelemetry(params: {
    meterSerial: string;
    burnKg: number;
    creditRemainingKg: number;
    valveOpen: boolean;
  }) {
    const meter = await this.metersRepo.findOne({
      where: { meterSerial: params.meterSerial },
    });
    if (!meter) return null;

    meter.dailyBurnKg = asDecimal(params.burnKg);
    meter.creditBalanceKg = asDecimal(params.creditRemainingKg);
    meter.lastTelemetryAt = new Date();
    meter.status = params.valveOpen
      ? params.creditRemainingKg < 0.5
        ? PaycMeterStatus.LOW_CREDIT
        : PaycMeterStatus.ACTIVE
      : PaycMeterStatus.VALVE_CLOSED;

    await this.metersRepo.save(meter);

    const revenue = round2(params.burnKg * 1850);
    if (revenue > 0) {
      await this.financeService.postEntry({
        eventType: JournalEventType.PAYC_BURN_REVENUE,
        description: `PAYC daily burn ${params.meterSerial}`,
        referenceType: 'PaycMeter',
        referenceId: meter.id,
        lines: [
          { account: GL_ACCOUNTS.DEFERRED_PAYC, debit: revenue },
          { account: GL_ACCOUNTS.REVENUE_PAYC, credit: revenue },
        ],
      });
    }

    return meter;
  }
}
