import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, round2, round3, toNumber } from '../common/decimal';
import {
  JournalEventType,
  PaycCreditTxnType,
  PaycMeterStatus,
  PaymentMethod,
} from '../common/enums';
import { Customer } from '../customers/customer.entity';
import { FinanceService, GL_ACCOUNTS } from '../finance/finance.service';
import { PaycCreditTransaction } from './payc-credit-transaction.entity';
import { PaycMeter } from './payc-meter.entity';
import { PaycTelemetry } from './payc-telemetry.entity';
import { ZhongyiMeterClient } from './zhongyi-meter.client';

const OFFLINE_HOURS = 24;
const PRICE_PER_KG = 1850;

@Injectable()
export class PaycService {
  constructor(
    @InjectRepository(PaycMeter)
    private readonly metersRepo: Repository<PaycMeter>,
    @InjectRepository(PaycTelemetry)
    private readonly telemetryRepo: Repository<PaycTelemetry>,
    @InjectRepository(PaycCreditTransaction)
    private readonly creditRepo: Repository<PaycCreditTransaction>,
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
    private readonly financeService: FinanceService,
    private readonly zhongyiClient: ZhongyiMeterClient,
  ) {}

  findAll() {
    return this.metersRepo.find({
      relations: { customer: true, station: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const meter = await this.metersRepo.findOne({
      where: { id },
      relations: { customer: true, station: true },
    });
    if (!meter) throw new NotFoundException('Meter not found');
    return meter;
  }

  async telemetryHistory(meterId: string, limit = 30) {
    return this.telemetryRepo.find({
      where: { meterId },
      order: { recordedAt: 'DESC' },
      take: limit,
    });
  }

  async creditHistory(meterId: string) {
    return this.creditRepo.find({
      where: { meterId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  private async markOfflineMeters() {
    const cutoff = new Date(Date.now() - OFFLINE_HOURS * 3600 * 1000);
    const meters = await this.metersRepo.find();
    for (const m of meters) {
      if (m.lastTelemetryAt && m.lastTelemetryAt < cutoff) {
        if (m.status !== PaycMeterStatus.OFFLINE) {
          m.status = PaycMeterStatus.OFFLINE;
          await this.metersRepo.save(m);
        }
      }
    }
  }

  async dashboard() {
    await this.markOfflineMeters();
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
      estimatedDailyRevenue: round2(dailyBurn * PRICE_PER_KG),
      dailyBurnKg: dailyBurn,
      alerts: [
        ...lowCredit.map((m) => ({
          type: 'LOW_CREDIT',
          meterSerial: m.meterSerial,
          message: `${m.meterSerial} below 0.5 kg credit`,
        })),
        ...offline.map((m) => ({
          type: 'OFFLINE',
          meterSerial: m.meterSerial,
          message: `${m.meterSerial} no telemetry for ${OFFLINE_HOURS}h+`,
        })),
      ],
      meters: meters.slice(0, 20),
    };
  }

  async topUpCredit(params: {
    meterId: string;
    amountMwk: number;
    paymentMethod: PaymentMethod;
    reference?: string;
    pushToVendor?: boolean;
  }) {
    const meter = await this.findOne(params.meterId);
    const creditKg = round3(params.amountMwk / PRICE_PER_KG);
    meter.creditBalanceKg = asDecimal(
      toNumber(meter.creditBalanceKg) + creditKg,
    );
    meter.deferredRevenue = asDecimal(
      toNumber(meter.deferredRevenue) + params.amountMwk,
      2,
    );
    if (toNumber(meter.creditBalanceKg) >= 0.5) {
      meter.status = PaycMeterStatus.ACTIVE;
    }
    await this.metersRepo.save(meter);

    await this.creditRepo.save(
      this.creditRepo.create({
        meterId: meter.id,
        type: PaycCreditTxnType.TOPUP,
        amountMwk: asDecimal(params.amountMwk, 2),
        creditKg: asDecimal(creditKg),
        paymentMethod: params.paymentMethod,
        reference: params.reference,
      }),
    );

    await this.financeService.postEntry({
      eventType: JournalEventType.PAYC_CREDIT_TOPUP,
      description: `PAYC credit top-up ${meter.meterSerial}`,
      referenceType: 'PaycMeter',
      referenceId: meter.id,
      lines: [
        { account: GL_ACCOUNTS.CASH, debit: params.amountMwk },
        { account: GL_ACCOUNTS.DEFERRED_PAYC, credit: params.amountMwk },
      ],
    });

    if (params.pushToVendor !== false && meter.imei && this.zhongyiClient.enabled) {
      await this.zhongyiClient.remotelyTopUp(meter.imei, params.amountMwk);
    }

    return meter;
  }

  async syncMeterFromVendor(meterId: string) {
    const meter = await this.findOne(meterId);
    if (!meter.imei) {
      throw new BadRequestException('Meter has no IMEI linked for vendor sync');
    }
    if (!this.zhongyiClient.enabled) {
      throw new BadRequestException('Zhongyi vendor API is not configured');
    }

    const data = await this.zhongyiClient.queryRealTimeData(meter.imei);
    const creditKg = round3(toNumber(data.balance) / PRICE_PER_KG);
    const valveOpen = data.valve === 1;

    return this.ingestTelemetry({
      meterSerial: meter.meterSerial,
      burnKg: toNumber(meter.dailyBurnKg),
      creditRemainingKg: creditKg,
      valveOpen,
    });
  }

  async syncAllMetersFromVendor() {
    if (!this.zhongyiClient.enabled) {
      throw new BadRequestException('Zhongyi vendor API is not configured');
    }

    const meters = await this.metersRepo.find({ where: {} });
    const synced: string[] = [];
    for (const meter of meters) {
      if (!meter.imei) continue;
      try {
        await this.syncMeterFromVendor(meter.id);
        synced.push(meter.meterSerial);
      } catch {
        // Continue syncing remaining meters.
      }
    }
    return { synced: synced.length, meterSerials: synced };
  }

  async rebindCylinder(meterId: string, cylinderSerial: string) {
    const meter = await this.findOne(meterId);
    meter.cylinderSerial = cylinderSerial;
    return this.metersRepo.save(meter);
  }

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

    await this.telemetryRepo.save(
      this.telemetryRepo.create({
        meterId: meter.id,
        burnKg: asDecimal(params.burnKg),
        creditRemainingKg: asDecimal(params.creditRemainingKg),
        valveOpen: params.valveOpen,
      }),
    );

    meter.dailyBurnKg = asDecimal(params.burnKg);
    meter.creditBalanceKg = asDecimal(params.creditRemainingKg);
    meter.lastTelemetryAt = new Date();
    meter.status = params.valveOpen
      ? params.creditRemainingKg < 0.5
        ? PaycMeterStatus.LOW_CREDIT
        : PaycMeterStatus.ACTIVE
      : PaycMeterStatus.VALVE_CLOSED;

    await this.metersRepo.save(meter);

    const revenue = round2(params.burnKg * PRICE_PER_KG);
    if (revenue > 0) {
      await this.creditRepo.save(
        this.creditRepo.create({
          meterId: meter.id,
          type: PaycCreditTxnType.BURN,
          amountMwk: asDecimal(revenue, 2),
          creditKg: asDecimal(params.burnKg),
        }),
      );
      meter.deferredRevenue = asDecimal(
        Math.max(0, toNumber(meter.deferredRevenue) - revenue),
        2,
      );
      await this.metersRepo.save(meter);

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

  async ingestBatch(
    readings: Array<{
      meterSerial: string;
      burnKg: number;
      creditRemainingKg: number;
      valveOpen: boolean;
    }>,
  ) {
    const results = [];
    for (const r of readings) {
      const m = await this.ingestTelemetry(r);
      if (m) results.push(m);
    }
    return { processed: results.length };
  }

  async getVendorStatus() {
    if (!this.zhongyiClient.enabled) {
      return {
        configured: false,
        connected: false,
        message: 'Set ZHONGYI_USERNAME and ZHONGYI_PASSWORD on the server',
      };
    }
    const ping = await this.zhongyiClient.ping();
    if (!ping.ok) {
      return {
        configured: true,
        connected: false,
        message: 'Could not connect to Zhongyi — check credentials and network',
      };
    }
    const cfg = await this.zhongyiClient.getVendorConfig();
    return {
      configured: true,
      connected: true,
      areaName: cfg.areaName,
      areaId: cfg.areaId,
      equipmentModelId: cfg.equipmentModelId,
      equipmentModelName: cfg.equipmentModelName,
      vendorMeterPages: ping.meterCount,
    };
  }

  async importFromVendor() {
    if (!this.zhongyiClient.enabled) {
      throw new BadRequestException('Zhongyi vendor API is not configured');
    }

    const archives = await this.zhongyiClient.getAllAreaArchives();
    let created = 0;
    let updated = 0;
    let linked = 0;

    for (const row of archives) {
      const imei = row.IMEI?.trim();
      const serial = row.serialnumber?.trim() || imei;
      if (!serial) continue;

      const balanceMwk = round2(toNumber(row.balance));
      const creditKg = round3(balanceMwk / PRICE_PER_KG);
      const valveOpen = row.valveStatus === 1;
      let status = PaycMeterStatus.ACTIVE;
      if (!valveOpen) status = PaycMeterStatus.VALVE_CLOSED;
      else if (creditKg < 0.5) status = PaycMeterStatus.LOW_CREDIT;

      let meter = imei
        ? await this.metersRepo.findOne({ where: { imei } })
        : null;
      if (!meter) {
        meter = await this.metersRepo.findOne({ where: { meterSerial: serial } });
      }

      let customerId: string | null | undefined = meter?.customerId;
      const phone = row.phone?.trim();
      if (phone && !customerId) {
        const customer = await this.customersRepo.findOne({
          where: { phone },
        });
        if (customer) {
          customerId = customer.id;
          linked++;
        }
      }

      const payload: Partial<PaycMeter> = {
        meterSerial: serial,
        imei: imei || meter?.imei,
        customerId: customerId ?? meter?.customerId ?? null,
        creditBalanceKg: asDecimal(creditKg),
        deferredRevenue: asDecimal(balanceMwk, 2),
        status,
        location: row.areaOrgName ?? meter?.location,
        lastTelemetryAt: new Date(),
      };

      if (meter) {
        Object.assign(meter, payload);
        await this.metersRepo.save(meter);
        updated++;
      } else {
        meter = this.metersRepo.create(payload);
        await this.metersRepo.save(meter);
        created++;
      }
    }

    return {
      imported: archives.length,
      created,
      updated,
      customersLinked: linked,
    };
  }

  async updateMeter(
    meterId: string,
    patch: {
      customerId?: string | null;
      stationId?: string | null;
      location?: string;
      cylinderSerial?: string;
    },
  ) {
    const meter = await this.findOne(meterId);
    if (patch.customerId !== undefined) meter.customerId = patch.customerId;
    if (patch.stationId !== undefined) meter.stationId = patch.stationId;
    if (patch.location !== undefined) meter.location = patch.location;
    if (patch.cylinderSerial !== undefined) {
      meter.cylinderSerial = patch.cylinderSerial;
    }
    return this.metersRepo.save(meter);
  }

  async controlValve(meterId: string, open: boolean) {
    const meter = await this.findOne(meterId);
    if (!meter.imei) {
      throw new BadRequestException('Meter has no IMEI for valve control');
    }
    if (!this.zhongyiClient.enabled) {
      throw new BadRequestException('Zhongyi vendor API is not configured');
    }

    await this.zhongyiClient.setValveState(meter.imei, open ? 1 : 0);
    meter.status = open
      ? toNumber(meter.creditBalanceKg) < 0.5
        ? PaycMeterStatus.LOW_CREDIT
        : PaycMeterStatus.ACTIVE
      : PaycMeterStatus.VALVE_CLOSED;
    await this.metersRepo.save(meter);
    return meter;
  }
}
