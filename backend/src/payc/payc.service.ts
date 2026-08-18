import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Repository } from 'typeorm';
import { asDecimal, round2, round3, toNumber } from '../common/decimal';
import {
  JournalEventType,
  NotificationChannel,
  PaycCreditTxnType,
  PaycMeterStatus,
  PaymentMethod,
  UserRole,
} from '../common/enums';
import { Customer } from '../customers/customer.entity';
import { FinanceService, GL_ACCOUNTS } from '../finance/finance.service';
import { Notification } from '../notifications/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/user.entity';
import { PaycCommand } from './payc-command.entity';
import { PaycCreditTransaction } from './payc-credit-transaction.entity';
import { PaycMeter } from './payc-meter.entity';
import { PaycTelemetry } from './payc-telemetry.entity';
import { ZhongyiMeterClient } from './zhongyi-meter.client';

const OFFLINE_HOURS = 24;
const LOW_CREDIT_KG = 0.5;
const PRICE_PER_KG = 1850;
const ALERT_COOLDOWN_HOURS = 24;

const PAYC_OPS_ROLES = [
  UserRole.SYSTEM_ADMIN,
  UserRole.DIRECTOR,
  UserRole.OPERATIONS_MANAGER,
  UserRole.STATION_MANAGER,
];

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
    @InjectRepository(PaycCommand)
    private readonly commandsRepo: Repository<PaycCommand>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
    private readonly financeService: FinanceService,
    private readonly notificationsService: NotificationsService,
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
    const valveClosed = meters.filter(
      (m) => m.status === PaycMeterStatus.VALVE_CLOSED,
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
      valveClosedMeters: valveClosed.length,
      totalDeferredRevenue: totalDeferred,
      totalCreditKg,
      estimatedDailyRevenue: round2(dailyBurn * PRICE_PER_KG),
      dailyBurnKg: dailyBurn,
      alerts: [
        ...lowCredit.map((m) => ({
          type: 'LOW_CREDIT',
          meterSerial: m.meterSerial,
          message: `${m.meterSerial} below ${LOW_CREDIT_KG} kg credit`,
        })),
        ...offline.map((m) => ({
          type: 'OFFLINE',
          meterSerial: m.meterSerial,
          message: `${m.meterSerial} no telemetry for ${OFFLINE_HOURS}h+`,
        })),
        ...valveClosed.map((m) => ({
          type: 'VALVE_CLOSED',
          meterSerial: m.meterSerial,
          message: `${m.meterSerial} valve is closed`,
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
    if (toNumber(meter.creditBalanceKg) >= LOW_CREDIT_KG) {
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

    if (data.battery) meter.batteryVoltage = asDecimal(toNumber(data.battery), 2);
    if (data.cumulantFlow) {
      meter.cumulativeFlow = asDecimal(toNumber(data.cumulantFlow), 3);
    }
    meter.valveOpen = valveOpen;
    if (data.readTime) {
      const parsed = new Date(data.readTime.replace(' ', 'T'));
      if (!Number.isNaN(parsed.getTime())) meter.vendorReadTime = parsed;
    }

    const daily = await this.zhongyiClient.queryDailyConsumption([meter.imei]);
    const burnKg = daily[0]?.consumption ?? toNumber(meter.dailyBurnKg);

    return this.ingestTelemetry({
      meterSerial: meter.meterSerial,
      burnKg,
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
    meter.valveOpen = params.valveOpen;
    meter.status = params.valveOpen
      ? params.creditRemainingKg < LOW_CREDIT_KG
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
      else if (creditKg < LOW_CREDIT_KG) status = PaycMeterStatus.LOW_CREDIT;

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

  async controlValve(meterId: string, open: boolean, userId?: string) {
    const meter = await this.findOne(meterId);
    if (!meter.imei) {
      throw new BadRequestException('Meter has no IMEI for valve control');
    }
    if (!this.zhongyiClient.enabled) {
      throw new BadRequestException('Zhongyi vendor API is not configured');
    }

    const result = await this.zhongyiClient.setValveState(meter.imei, open ? 1 : 0);
    const command = await this.commandsRepo.save(
      this.commandsRepo.create({
        meterId: meter.id,
        commandType: open ? 'VALVE_OPEN' : 'VALVE_CLOSE',
        vendorValueId: result.valueId,
        status: 'PENDING',
        message: result.errmsg,
        requestedByUserId: userId ?? null,
      }),
    );

    meter.status = open
      ? toNumber(meter.creditBalanceKg) < LOW_CREDIT_KG
        ? PaycMeterStatus.LOW_CREDIT
        : PaycMeterStatus.ACTIVE
      : PaycMeterStatus.VALVE_CLOSED;
    meter.valveOpen = open;
    await this.metersRepo.save(meter);

    return { meter, command, vendorValueId: result.valueId, message: result.errmsg };
  }

  async sendDeviceCommand(
    meterId: string,
    commandStr: 'queryFlowAndStatus' | 'queryBattery',
    userId?: string,
  ) {
    const meter = await this.requireVendorMeter(meterId);
    const result = await this.zhongyiClient.sendCommand(meter.imei!, commandStr);
    const command = await this.commandsRepo.save(
      this.commandsRepo.create({
        meterId: meter.id,
        commandType: commandStr.toUpperCase(),
        vendorValueId: result.valueId,
        status: 'PENDING',
        message: result.errmsg,
        requestedByUserId: userId ?? null,
      }),
    );
    return { command, vendorValueId: result.valueId, message: result.errmsg };
  }

  async getCommandStatus(commandId: string) {
    const command = await this.commandsRepo.findOne({
      where: { id: commandId },
      relations: { meter: true },
    });
    if (!command) throw new NotFoundException('Command not found');
    if (!command.vendorValueId) return { command, vendor: null };

    try {
      const vendor = await this.zhongyiClient.queryCommandInfo(command.vendorValueId);
      if (vendor.state === 1) command.status = 'SUCCESS';
      else if (vendor.state === 2) command.status = 'FAILED';
      command.message = vendor.errmsg ?? command.message;
      await this.commandsRepo.save(command);
      return { command, vendor };
    } catch (err) {
      return {
        command,
        vendor: null,
        error: err instanceof Error ? err.message : 'Could not fetch command status',
      };
    }
  }

  commandHistory(meterId: string, limit = 30) {
    return this.commandsRepo.find({
      where: { meterId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: { requestedBy: true },
    });
  }

  async getMeterVendorSnapshot(meterId: string) {
    const meter = await this.requireVendorMeter(meterId);
    const [realtime, archive, valveStatus, valveRecords, consumption] =
      await Promise.all([
        this.zhongyiClient.queryRealTimeData(meter.imei!),
        this.zhongyiClient.getAreaArchiveInfo(meter.imei!).catch(() => null),
        this.zhongyiClient.readValveStatus(meter.imei!).catch(() => null),
        this.zhongyiClient.getValveRecords(meter.imei!, 1, 10).catch(() => ({
          rows: [],
          pageTotal: 0,
        })),
        this.zhongyiClient
          .queryHistoryMeterReading(meter.imei!)
          .catch(() => []),
      ]);

    return {
      meterId: meter.id,
      meterSerial: meter.meterSerial,
      imei: meter.imei,
      realtime,
      archive,
      valveStatus,
      valveRecords: valveRecords.rows,
      consumptionHistory: consumption.slice(0, 14),
    };
  }

  async runScheduledSyncAndAlerts() {
    if (!this.zhongyiClient.enabled) {
      return { synced: 0, alertsSent: 0, skipped: 'vendor_not_configured' };
    }

    await this.markOfflineMeters();
    const syncResult = await this.syncAllMetersFromVendor();
    const alertResult = await this.processAlerts();
    return {
      synced: syncResult.synced,
      alertsSent: alertResult.sent,
      alertTypes: alertResult.types,
    };
  }

  async processAlerts() {
    const meters = await this.metersRepo.find({ relations: { customer: true } });
    const recipients = await this.usersRepo.find({
      where: { role: In(PAYC_OPS_ROLES), isActive: true },
    });
    const cooldown = new Date(Date.now() - ALERT_COOLDOWN_HOURS * 3600 * 1000);
    let sent = 0;
    const types: string[] = [];

    for (const meter of meters) {
      const alerts: Array<{ eventType: string; title: string; body: string }> = [];

      if (meter.status === PaycMeterStatus.LOW_CREDIT) {
        alerts.push({
          eventType: 'PAYC_LOW_CREDIT',
          title: `Low credit: ${meter.meterSerial}`,
          body: `${meter.meterSerial} has ${formatKgAlert(toNumber(meter.creditBalanceKg))} remaining (${formatMoneyAlert(toNumber(meter.deferredRevenue))}). Top up soon.`,
        });
      }
      if (meter.status === PaycMeterStatus.OFFLINE) {
        alerts.push({
          eventType: 'PAYC_OFFLINE',
          title: `Offline meter: ${meter.meterSerial}`,
          body: `${meter.meterSerial} has not reported telemetry for ${OFFLINE_HOURS}+ hours.`,
        });
      }
      if (
        meter.status === PaycMeterStatus.VALVE_CLOSED &&
        toNumber(meter.creditBalanceKg) <= 0
      ) {
        alerts.push({
          eventType: 'PAYC_VALVE_CLOSED',
          title: `Valve closed — no credit: ${meter.meterSerial}`,
          body: `${meter.meterSerial} valve is closed with zero credit. Customer may need top-up.`,
        });
      }

      for (const alert of alerts) {
        const recent = await this.notificationsRepo.findOne({
          where: {
            eventType: alert.eventType,
            relatedEntityId: meter.id,
            createdAt: MoreThan(cooldown),
          },
        });
        if (recent) continue;

        for (const user of recipients) {
          await this.notificationsService.dispatch({
            eventType: alert.eventType,
            title: alert.title,
            body: alert.body,
            userId: user.id,
            entityType: 'PaycMeter',
            entityId: meter.id,
            channels: [NotificationChannel.IN_APP],
            mandatory: true,
          });
        }
        sent += recipients.length;
        types.push(alert.eventType);
      }
    }

    return { sent, types: [...new Set(types)] };
  }

  private async requireVendorMeter(meterId: string) {
    const meter = await this.findOne(meterId);
    if (!meter.imei) {
      throw new BadRequestException('Meter has no IMEI linked for vendor operations');
    }
    if (!this.zhongyiClient.enabled) {
      throw new BadRequestException('Zhongyi vendor API is not configured');
    }
    return meter;
  }
}

function formatKgAlert(kg: number) {
  return `${kg.toFixed(3)} kg`;
}

function formatMoneyAlert(mwk: number) {
  return `MWK ${mwk.toLocaleString('en-MW', { maximumFractionDigits: 0 })}`;
}
