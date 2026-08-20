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
import { ZhongyiMeterClient, ZhongyiRealtimeData } from './zhongyi-meter.client';

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

  private async getMeterFlatPrice(meter: Pick<PaycMeter, 'imei'>): Promise<number> {
    if (meter.imei && this.zhongyiClient.enabled) {
      try {
        const archive = await this.zhongyiClient.getAreaArchiveInfo(meter.imei);
        if (archive.priceInfo?.flatPrice) {
          return toNumber(archive.priceInfo.flatPrice);
        }
      } catch {
        // Fall back to ERP default price when archive lookup fails.
      }
    }
    return PRICE_PER_KG;
  }

  private applyPrepaidBalance(meter: PaycMeter, flatPrice: number) {
    meter.deferredRevenue = asDecimal(
      round2(toNumber(meter.creditBalanceKg) * flatPrice),
      2,
    );
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
    const estimatedDailyRevenue = round2(
      (
        await Promise.all(
          meters.map(async (m) => {
            const flatPrice = await this.getMeterFlatPrice(m);
            return toNumber(m.dailyBurnKg) * flatPrice;
          }),
        )
      ).reduce((s, v) => s + v, 0),
    );

    return {
      totalMeters: meters.length,
      activeMeters: active.length,
      offlineMeters: offline.length,
      lowCreditMeters: lowCredit.length,
      valveClosedMeters: valveClosed.length,
      totalDeferredRevenue: totalDeferred,
      totalCreditKg,
      estimatedDailyRevenue,
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
    const flatPrice = await this.getMeterFlatPrice(meter);

    const creditKg = round3(params.amountMwk / flatPrice);
    meter.creditBalanceKg = asDecimal(
      toNumber(meter.creditBalanceKg) + creditKg,
    );
    this.applyPrepaidBalance(meter, flatPrice);
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
      const vendorTopUp = await this.zhongyiClient.remotelyTopUp(
        meter.imei,
        params.amountMwk,
      );
      const vendorRef = vendorTopUp.valueId ?? vendorTopUp.orderId;
      const command = await this.commandsRepo.save(
        this.commandsRepo.create({
          meterId: meter.id,
          commandType: 'remotelyTopUp',
          status: 'PENDING',
          vendorValueId: vendorRef,
          message: `Top-up queued — ${vendorTopUp.creditKg} kg for ${params.amountMwk} MWK @ ${vendorTopUp.flatPrice}/kg`,
        }),
      );
      if (vendorRef) {
        await this.refreshCommandFromVendor(command.id).catch(() => undefined);
      }
      try {
        await this.syncMeterFromVendor(meter.id);
        await this.finalizeStaleTopUpCommand(
          meter.id,
          params.amountMwk,
          vendorTopUp.creditKg,
        );
      } catch {
        // Device may apply credit when it next connects.
      }
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
    const creditKg = this.zhongyiClient.extractCreditKgFromRealtime(
      data as ZhongyiRealtimeData & Record<string, unknown>,
    );
    const valveOpen = this.zhongyiClient.extractValveOpen(data);

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

    const previousCreditKg = toNumber(meter.creditBalanceKg);
    const flatPrice = await this.getMeterFlatPrice(meter);

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
    this.applyPrepaidBalance(meter, flatPrice);

    const consumedKg = round3(
      Math.max(0, previousCreditKg - params.creditRemainingKg),
    );
    const revenue = round2(consumedKg * flatPrice);
    if (consumedKg > 0.001 && revenue > 0) {
      await this.creditRepo.save(
        this.creditRepo.create({
          meterId: meter.id,
          type: PaycCreditTxnType.BURN,
          amountMwk: asDecimal(revenue, 2),
          creditKg: asDecimal(consumedKg),
        }),
      );

      await this.financeService.postEntry({
        eventType: JournalEventType.PAYC_BURN_REVENUE,
        description: `PAYC gas consumed ${params.meterSerial}`,
        referenceType: 'PaycMeter',
        referenceId: meter.id,
        lines: [
          { account: GL_ACCOUNTS.DEFERRED_PAYC, debit: revenue },
          { account: GL_ACCOUNTS.REVENUE_PAYC, credit: revenue },
        ],
      });
    }

    await this.metersRepo.save(meter);

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

      const creditKg = round3(toNumber(row.readings));
      const flatPrice = imei
        ? await this.getMeterFlatPrice({ imei })
        : PRICE_PER_KG;
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
        deferredRevenue: asDecimal(round2(creditKg * flatPrice), 2),
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
        message: this.initialCommandMessage(
          open ? 'VALVE_OPEN' : 'VALVE_CLOSE',
          result.errmsg,
        ),
        requestedByUserId: userId ?? null,
      }),
    );

    void this.refreshCommandFromVendor(command.id)
      .then(async () => {
        try {
          await this.syncMeterFromVendor(meter.id);
        } catch {
          // NB-IoT meters may take minutes to respond; scheduled sync will retry.
        }
      })
      .catch(() => undefined);

    return { meter, command, vendorValueId: result.valueId, message: result.errmsg };
  }

  async sendDeviceCommand(
    meterId: string,
    commandStr: 'queryFlowAndStatus' | 'queryBattery',
    userId?: string,
  ) {
    const meter = await this.requireVendorMeter(meterId);

    // These NB-IoT LPG meters do not support queryFlowAndStatus via sendCommand;
    // Zhongyi returns "Unsupported commands!" — read realtime data instead.
    if (commandStr === 'queryFlowAndStatus') {
      return this.readFlowAndStatusFromVendor(meter, userId);
    }

    try {
      const result = await this.zhongyiClient.sendCommand(meter.imei!, commandStr);
      const command = await this.commandsRepo.save(
        this.commandsRepo.create({
          meterId: meter.id,
          commandType: commandStr.toUpperCase(),
          vendorValueId: result.valueId,
          status: 'PENDING',
          message: this.initialCommandMessage(commandStr.toUpperCase(), result.errmsg),
          requestedByUserId: userId ?? null,
        }),
      );
      void this.refreshCommandFromVendor(command.id).catch(() => undefined);
      return { command, vendorValueId: result.valueId, message: result.errmsg };
    } catch (err) {
      const detail =
        err instanceof Error
          ? err.message.replace(/^Zhongyi API error:\s*/i, '')
          : 'Device command failed';
      throw new BadRequestException(detail);
    }
  }

  private async readFlowAndStatusFromVendor(meter: PaycMeter, userId?: string) {
    const [realtime, valveStatus] = await Promise.all([
      this.zhongyiClient.queryRealTimeData(meter.imei!),
      this.zhongyiClient.readValveStatus(meter.imei!).catch(() => null),
    ]);

    await this.syncMeterFromVendor(meter.id);

    const creditKg = this.zhongyiClient.extractCreditKgFromRealtime(
      realtime as ZhongyiRealtimeData & Record<string, unknown>,
    );
    const valveLabel =
      valveStatus?.valveStatus ??
      (this.zhongyiClient.extractValveOpen(realtime) ? 'open' : 'closed');
    const parts = [
      `Credit ${creditKg} kg`,
      `valve ${valveLabel}`,
    ];
    if (realtime.battery) parts.push(`battery ${realtime.battery}V`);
    if (realtime.readTime) parts.push(`read ${realtime.readTime}`);

    const message = `Flow and status read — ${parts.join(', ')}`;
    const command = await this.commandsRepo.save(
      this.commandsRepo.create({
        meterId: meter.id,
        commandType: 'QUERYFLOWANDSTATUS',
        status: 'SUCCESS',
        message,
        requestedByUserId: userId ?? null,
      }),
    );

    return { command, message, instant: true as const };
  }

  private isStaleCommandMessage(message?: string | null) {
    if (!message) return false;
    const normalized = message.trim();
    return /please wait|recharging|successful delivery|^successful$/i.test(normalized);
  }

  private messageNeedsRepair(message?: string | null) {
    return this.isStaleCommandMessage(message);
  }

  private initialCommandMessage(commandType: string, vendorErrmsg?: string) {
    if (vendorErrmsg && !this.isStaleCommandMessage(vendorErrmsg)) {
      return vendorErrmsg;
    }
    if (commandType === 'VALVE_OPEN') return 'Valve open command queued — waiting for meter…';
    if (commandType === 'VALVE_CLOSE') return 'Valve close command queued — waiting for meter…';
    if (commandType === 'QUERYFLOWANDSTATUS') {
      return 'Flow/status query queued — waiting for meter…';
    }
    if (commandType === 'QUERYBATTERY') return 'Battery query queued — waiting for meter…';
    return 'Command queued — waiting for meter…';
  }

  private friendlySuccessMessage(commandType: string) {
    if (commandType === 'remotelyTopUp') return 'Top-up delivered to meter';
    if (commandType === 'VALVE_OPEN') return 'Valve opened successfully';
    if (commandType === 'VALVE_CLOSE') return 'Valve closed successfully';
    if (commandType === 'QUERYFLOWANDSTATUS') return 'Flow and status read completed';
    if (commandType === 'QUERYBATTERY') return 'Battery query completed';
    return 'Command completed successfully';
  }

  private repairLegacyTopUpMessage(message?: string | null) {
    if (!message) return null;
    const match = message.match(/top-up (\d+(?:\.\d+)?) MWK \(([\d.]+) kg/i);
    if (!match) return null;
    return `Top-up delivered — ${match[2]} kg credited (${match[1]} MWK)`;
  }

  private repairCommandMessage(command: PaycCommand) {
    const status = command.status;
    if (
      (status === 'SUCCESS' || status === 'COMPLETED') &&
      this.messageNeedsRepair(command.message)
    ) {
      command.status = 'SUCCESS';
      command.message =
        command.commandType === 'remotelyTopUp'
          ? this.repairLegacyTopUpMessage(command.message) ??
            this.friendlySuccessMessage(command.commandType)
          : this.friendlySuccessMessage(command.commandType);
      return true;
    }
    if (status === 'FAILED' && this.messageNeedsRepair(command.message)) {
      command.message = 'Command failed — meter did not confirm';
      return true;
    }
    if (status === 'PENDING' && this.messageNeedsRepair(command.message)) {
      command.message = 'Waiting for meter response…';
      return true;
    }
    return false;
  }

  private inferCommandOutcome(vendor: {
    state?: number;
    errmsg?: string;
    jsonParse?: Record<string, unknown>;
  }): 'SUCCESS' | 'FAILED' | 'PENDING' {
    const values = vendor.jsonParse?.values;
    if (Array.isArray(values)) {
      for (const item of values) {
        if (!item || typeof item !== 'object') continue;
        const record = item as Record<string, string>;
        const impl =
          record['Implementation results'] ??
          record['implementation results'];
        if (impl) {
          if (/successful/i.test(impl)) return 'SUCCESS';
          if (/fail|error|reject|unsuccessful/i.test(impl)) return 'FAILED';
        }
      }
      const awaitingDevice = values.some(
        (item) =>
          item &&
          typeof item === 'object' &&
          ('Packet1' in item || 'packet1' in (item as object)),
      );
      if (awaitingDevice && (vendor.state === 0 || vendor.state == null)) {
        return 'PENDING';
      }
    }

    if (vendor.state === 0 || vendor.state == null) return 'PENDING';
    if (vendor.state === 1 || vendor.state === 2) return 'SUCCESS';
    return 'PENDING';
  }

  private extractImplementationDetail(vendor: {
    jsonParse?: Record<string, unknown>;
  }): string | null {
    const values = vendor.jsonParse?.values;
    if (!Array.isArray(values)) return null;
    for (const item of values) {
      if (!item || typeof item !== 'object') continue;
      const record = item as Record<string, string>;
      const impl =
        record['Implementation results'] ?? record['implementation results'];
      if (impl) return impl;
    }
    return null;
  }

  private mapVendorCommandState(vendor: {
    state?: number;
    errmsg?: string;
    jsonParse?: Record<string, unknown>;
  }) {
    return this.inferCommandOutcome(vendor);
  }

  private resolveVendorCommandMessage(
    vendor: { state?: number; errmsg?: string; jsonParse?: Record<string, unknown> },
    commandType: string,
    fallback?: string,
  ) {
    const mappedStatus = this.mapVendorCommandState(vendor);
    if (mappedStatus === 'SUCCESS') {
      const impl = this.extractImplementationDetail(vendor);
      if (impl && !this.isStaleCommandMessage(impl)) return impl;
      return this.friendlySuccessMessage(commandType);
    }
    if (mappedStatus === 'FAILED') {
      if (vendor.errmsg && !this.isStaleCommandMessage(vendor.errmsg)) {
        return vendor.errmsg;
      }
      return 'Command failed on meter';
    }
    if (vendor.errmsg && !this.isStaleCommandMessage(vendor.errmsg)) {
      return vendor.errmsg;
    }
    if (fallback && !this.isStaleCommandMessage(fallback)) {
      return fallback;
    }
    return 'Waiting for meter response…';
  }

  private applyPendingCommandContext(command: PaycCommand, meter?: PaycMeter | null) {
    if (command.status !== 'PENDING') return;
    const ageMs = Date.now() - command.createdAt.getTime();
    const ageHours = Math.floor(ageMs / (3600 * 1000));
    const ageMinutes = Math.floor((ageMs % (3600 * 1000)) / (60 * 1000));

    if (ageMs < 30 * 60 * 1000) return;

    const valveHint =
      meter?.valveOpen === false
        ? 'Last sync shows the valve is closed on the meter.'
        : meter?.valveOpen === true
          ? 'Last sync shows the valve is still open on the meter.'
          : 'Sync the meter to refresh live valve status.';

    if (ageMs >= 2 * 3600 * 1000) {
      command.message = `Meter has not responded after ${ageHours}h ${ageMinutes}m. ${valveHint} NB-IoT devices wake periodically — try Sync from Zhongyi or send the command again.`;
      return;
    }

    command.message = `Waiting for meter response (${ageMinutes}m). ${valveHint}`;
  }

  private async finalizeStaleTopUpCommand(
    meterId: string,
    amountMwk: number,
    creditKg: number,
  ) {
    const cmd = await this.commandsRepo.findOne({
      where: { meterId, commandType: 'remotelyTopUp' },
      order: { createdAt: 'DESC' },
    });
    if (!cmd || cmd.status === 'FAILED' || cmd.vendorValueId) {
      return;
    }
    if (cmd.status !== 'PENDING' && cmd.status !== 'COMPLETED') {
      return;
    }
    cmd.status = 'SUCCESS';
    cmd.message =
      this.repairLegacyTopUpMessage(cmd.message) ??
      `Top-up delivered — ${creditKg} kg credited (${amountMwk} MWK)`;
    await this.commandsRepo.save(cmd);
  }

  async refreshCommandFromVendor(commandId: string) {
    const command = await this.commandsRepo.findOne({
      where: { id: commandId },
      relations: { meter: true },
    });
    if (!command) throw new NotFoundException('Command not found');
    if (!command.vendorValueId) return command;

    const vendor = await this.zhongyiClient.queryCommandInfo(command.vendorValueId);
    command.status = this.mapVendorCommandState(vendor);
    command.message = this.resolveVendorCommandMessage(
      vendor,
      command.commandType,
      command.message,
    );
    this.repairCommandMessage(command);
    this.applyPendingCommandContext(command, command.meter);
    await this.commandsRepo.save(command);
    return command;
  }

  private async repairMeterCommandMessages(meterId: string) {
    const commands = await this.commandsRepo.find({
      where: { meterId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    let repaired = 0;
    for (const cmd of commands) {
      if (this.repairCommandMessage(cmd)) {
        await this.commandsRepo.save(cmd);
        repaired++;
      }
    }
    return repaired;
  }

  async refreshMeterCommands(meterId: string) {
    await this.findOne(meterId);
    const commands = await this.commandsRepo.find({
      where: { meterId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    let updated = 0;
    for (const cmd of commands) {
      const shouldRefresh =
        (cmd.status === 'PENDING' && !!cmd.vendorValueId) ||
        (this.messageNeedsRepair(cmd.message) && !!cmd.vendorValueId);
      if (!shouldRefresh) continue;
      try {
        await this.refreshCommandFromVendor(cmd.id);
        updated++;
      } catch {
        // Keep polling on next refresh cycle.
      }
    }

    updated += await this.repairMeterCommandMessages(meterId);

    return {
      updated,
      commands: await this.commandHistory(meterId),
    };
  }

  async refreshPendingCommands() {
    const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const pending = await this.commandsRepo.find({
      where: { status: 'PENDING', createdAt: MoreThan(cutoff) },
      order: { createdAt: 'ASC' },
      take: 100,
    });

    const staleCompleted = await this.commandsRepo.find({
      where: { status: 'COMPLETED', createdAt: MoreThan(cutoff) },
      order: { createdAt: 'ASC' },
      take: 100,
    });

    let updated = 0;
    for (const cmd of [...pending, ...staleCompleted]) {
      if (cmd.vendorValueId) {
        try {
          await this.refreshCommandFromVendor(cmd.id);
          updated++;
          continue;
        } catch {
          // Fall through to local repair.
        }
      }
      if (this.repairCommandMessage(cmd)) {
        await this.commandsRepo.save(cmd);
        updated++;
      }
    }
    return { updated };
  }

  async getCommandStatus(commandId: string) {
    const command = await this.commandsRepo.findOne({
      where: { id: commandId },
      relations: { meter: true },
    });
    if (!command) throw new NotFoundException('Command not found');
    if (!command.vendorValueId) return { command, vendor: null };

    try {
      const refreshed = await this.refreshCommandFromVendor(commandId);
      return { command: refreshed, vendor: { state: refreshed.status === 'SUCCESS' ? 1 : refreshed.status === 'FAILED' ? 2 : 0 } };
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

    const flatPriceMwkPerKg = archive?.priceInfo?.flatPrice
      ? toNumber(archive.priceInfo.flatPrice)
      : null;

    return {
      meterId: meter.id,
      meterSerial: meter.meterSerial,
      imei: meter.imei,
      flatPriceMwkPerKg,
      priceName: archive?.priceInfo?.priceName ?? null,
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
    const commandResult = await this.refreshPendingCommands();
    const alertResult = await this.processAlerts();
    return {
      synced: syncResult.synced,
      commandsUpdated: commandResult.updated,
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
