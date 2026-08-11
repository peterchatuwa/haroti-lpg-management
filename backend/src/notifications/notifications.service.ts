import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as nodemailer from 'nodemailer';
import { IsNull, Repository } from 'typeorm';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationStatus,
} from '../common/enums';
import { NotificationDelivery } from './notification-delivery.entity';
import { NotificationPreference } from './notification-preference.entity';
import { Notification } from './notification.entity';

export interface SmsResult {
  sent: boolean;
  mode: 'gateway' | 'log';
  to?: string;
  error?: string;
}

const MAX_DELIVERY_ATTEMPTS = 5;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private mailTransporter?: nodemailer.Transporter;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
    @InjectRepository(NotificationDelivery)
    private readonly deliveriesRepo: Repository<NotificationDelivery>,
    @InjectRepository(NotificationPreference)
    private readonly preferencesRepo: Repository<NotificationPreference>,
  ) {}

  async dispatch(params: {
    eventType: string;
    title: string;
    body: string;
    userId?: string;
    entityType?: string;
    entityId?: string;
    channels?: NotificationChannel[];
    phone?: string;
    email?: string;
    mandatory?: boolean;
  }) {
    const channels =
      params.channels ??
      (await this.resolveChannels(params.userId, params.eventType, params.mandatory));

    const notification = await this.notificationsRepo.save(
      this.notificationsRepo.create({
        userId: params.userId,
        eventType: params.eventType,
        title: params.title,
        body: params.body,
        status: NotificationStatus.PENDING,
        relatedEntityType: params.entityType,
        relatedEntityId: params.entityId,
      }),
    );

    const deliveries: NotificationDelivery[] = [];
    for (const channel of channels) {
      let recipient: string | undefined;
      if (channel === NotificationChannel.SMS || channel === NotificationChannel.WHATSAPP) {
        recipient = params.phone;
      } else if (channel === NotificationChannel.EMAIL) {
        recipient = params.email;
      } else {
        recipient = params.userId;
      }

      deliveries.push(
        this.deliveriesRepo.create({
          notificationId: notification.id,
          channel,
          recipient,
          status:
            channel === NotificationChannel.IN_APP
              ? NotificationDeliveryStatus.SENT
              : NotificationDeliveryStatus.QUEUED,
          nextRetryAt: new Date(),
        }),
      );
    }

    await this.deliveriesRepo.save(deliveries);
    if (channels.includes(NotificationChannel.IN_APP)) {
      notification.status = NotificationStatus.DELIVERED;
      await this.notificationsRepo.save(notification);
    }
    return notification;
  }

  listForUser(userId: string, unreadOnly = false) {
    return this.notificationsRepo.find({
      where: {
        userId,
        ...(unreadOnly ? { readAt: IsNull() } : {}),
      },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    const note = await this.notificationsRepo.findOne({ where: { id, userId } });
    if (!note) throw new NotFoundException('Notification not found');
    note.readAt = new Date();
    note.status = NotificationStatus.READ;
    return this.notificationsRepo.save(note);
  }

  async processQueue(limit = 25) {
    const pending = await this.deliveriesRepo.find({
      where: { status: NotificationDeliveryStatus.QUEUED },
      relations: { notification: true },
      order: { nextRetryAt: 'ASC' },
      take: limit,
    });

    let sent = 0;
    let failed = 0;
    for (const delivery of pending) {
      if (delivery.nextRetryAt && delivery.nextRetryAt > new Date()) continue;

      const result = await this.sendDelivery(delivery);
      delivery.attempts += 1;
      if (result.ok) {
        delivery.status = NotificationDeliveryStatus.SENT;
        delivery.providerRef = result.ref;
        delivery.lastError = null;
        sent += 1;
      } else {
        delivery.lastError = result.error;
        if (delivery.attempts >= MAX_DELIVERY_ATTEMPTS) {
          delivery.status = NotificationDeliveryStatus.FAILED;
          failed += 1;
        } else {
          const retry = new Date();
          retry.setMinutes(retry.getMinutes() + delivery.attempts * 5);
          delivery.nextRetryAt = retry;
        }
      }
      await this.deliveriesRepo.save(delivery);
    }
    return { processed: pending.length, sent, failed };
  }

  listPreferences(userId: string) {
    return this.preferencesRepo.find({ where: { userId } });
  }

  async upsertPreference(params: {
    userId: string;
    eventType: string;
    channel: NotificationChannel;
    enabled: boolean;
  }) {
    let pref = await this.preferencesRepo.findOne({
      where: {
        userId: params.userId,
        eventType: params.eventType,
        channel: params.channel,
      },
    });
    if (!pref) {
      pref = this.preferencesRepo.create(params);
    } else if (!pref.isMandatory) {
      pref.enabled = params.enabled;
    }
    return this.preferencesRepo.save(pref);
  }

  async sendSms(to: string | undefined, message: string): Promise<SmsResult> {
    const phone = this.normalizePhone(to);
    if (!phone) {
      return { sent: false, mode: 'log', error: 'no_phone' };
    }

    const enabled = this.config.get<string>('SMS_ENABLED', 'false') === 'true';
    const url = this.config.get<string>('SMS_API_URL');
    const apiKey = this.config.get<string>('SMS_API_KEY');

    if (!enabled || !url) {
      this.logger.log(`[SMS] ${phone}: ${message}`);
      return { sent: false, mode: 'log', to: phone };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ to: phone, message }),
      });
      if (!res.ok) {
        const body = await res.text();
        this.logger.warn(`SMS gateway ${res.status}: ${body}`);
        return { sent: false, mode: 'gateway', to: phone, error: body };
      }
      return { sent: true, mode: 'gateway', to: phone };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`SMS send failed: ${msg}`);
      return { sent: false, mode: 'gateway', to: phone, error: msg };
    }
  }

  notifyPaymentReceived(params: {
    phone?: string;
    customerName: string;
    amount: number;
    balance: number;
  }) {
    const msg = `Haroti Gas: Payment of MWK ${params.amount.toFixed(0)} received. Balance: MWK ${params.balance.toFixed(0)}. Thank you, ${params.customerName}.`;
    return this.sendSms(params.phone, msg);
  }

  notifyCreditSale(params: {
    phone?: string;
    customerName: string;
    amount: number;
    receiptNumber: string;
    balance: number;
  }) {
    const msg = `Haroti Gas: Credit sale ${params.receiptNumber} for MWK ${params.amount.toFixed(0)}. New balance: MWK ${params.balance.toFixed(0)}.`;
    return this.sendSms(params.phone, msg);
  }

  notifyHydroWorkOrder(params: {
    phone?: string;
    serialNumber: string;
    stationCode?: string;
  }) {
    const msg = `Haroti Ops: Hydro test due for cylinder ${params.serialNumber}${params.stationCode ? ` at ${params.stationCode}` : ''}. Work order created.`;
    const opsPhone =
      params.phone ?? this.config.get<string>('SMS_OPS_PHONE');
    return this.sendSms(opsPhone, msg);
  }

  private async sendDelivery(
    delivery: NotificationDelivery,
  ): Promise<{ ok: boolean; ref?: string; error?: string }> {
    const note = delivery.notification;
    if (!note) return { ok: false, error: 'missing_notification' };

    switch (delivery.channel) {
      case NotificationChannel.IN_APP:
        return { ok: true, ref: 'in-app' };
      case NotificationChannel.SMS: {
        const sms = await this.sendSms(delivery.recipient ?? undefined, note.body);
        return sms.sent
          ? { ok: true, ref: sms.to }
          : { ok: sms.mode === 'log', ref: 'log', error: sms.error };
      }
      case NotificationChannel.WHATSAPP:
        return this.sendWhatsApp(delivery.recipient ?? undefined, note.body);
      case NotificationChannel.EMAIL:
        return this.sendEmail(delivery.recipient ?? undefined, note.title, note.body);
      default:
        return { ok: false, error: 'unsupported_channel' };
    }
  }

  private async sendWhatsApp(
    to: string | undefined,
    message: string,
  ): Promise<{ ok: boolean; ref?: string; error?: string }> {
    const phone = this.normalizePhone(to);
    const enabled =
      this.config.get<string>('WHATSAPP_ENABLED', 'false') === 'true';
    const url = this.config.get<string>('WHATSAPP_API_URL');
    if (!enabled || !url || !phone) {
      this.logger.log(`[WhatsApp] ${phone ?? 'n/a'}: ${message}`);
      return { ok: true, ref: 'log' };
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, message }),
      });
      if (!res.ok) {
        return { ok: false, error: await res.text() };
      }
      return { ok: true, ref: phone };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private async sendEmail(
    to: string | undefined,
    subject: string,
    body: string,
  ): Promise<{ ok: boolean; ref?: string; error?: string }> {
    const enabled = this.config.get<string>('EMAIL_ENABLED', 'false') === 'true';
    const host = this.config.get<string>('EMAIL_SMTP_HOST');
    if (!to) {
      return { ok: false, error: 'Missing recipient' };
    }
    if (!enabled || !host) {
      this.logger.log(`[Email] ${to}: ${subject}\n${body}`);
      return { ok: true, ref: 'log' };
    }

    try {
      const transporter = this.getMailTransporter();
      const from = this.config.get<string>(
        'EMAIL_FROM',
        'Haroti Gas ERP <noreply@harotiholdingslimited.com>',
      );
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br/>'),
      });
      return { ok: true, ref: info.messageId };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private getMailTransporter() {
    if (this.mailTransporter) return this.mailTransporter;
    const host = this.config.get<string>('EMAIL_SMTP_HOST', '');
    const port = Number(this.config.get<string>('EMAIL_SMTP_PORT', '587'));
    const user = this.config.get<string>('EMAIL_SMTP_USER');
    const pass = this.config.get<string>('EMAIL_SMTP_PASS');
    this.mailTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    });
    return this.mailTransporter;
  }

  private async resolveChannels(
    userId: string | undefined,
    eventType: string,
    mandatory?: boolean,
  ) {
    if (mandatory) {
      return [
        NotificationChannel.IN_APP,
        NotificationChannel.SMS,
        NotificationChannel.EMAIL,
      ];
    }
    if (!userId) {
      return [NotificationChannel.IN_APP];
    }
    const prefs = await this.preferencesRepo.find({ where: { userId, eventType } });
    if (!prefs.length) {
      return [NotificationChannel.IN_APP, NotificationChannel.SMS];
    }
    return prefs.filter((p) => p.enabled).map((p) => p.channel);
  }

  private normalizePhone(phone?: string) {
    if (!phone?.trim()) return undefined;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) return undefined;
    if (digits.startsWith('265')) return `+${digits}`;
    if (digits.startsWith('0')) return `+265${digits.slice(1)}`;
    return `+${digits}`;
  }
}
