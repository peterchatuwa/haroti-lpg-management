import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsResult {
  sent: boolean;
  mode: 'gateway' | 'log';
  to?: string;
  error?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly config: ConfigService) {}

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

  private normalizePhone(phone?: string) {
    if (!phone?.trim()) return undefined;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) return undefined;
    if (digits.startsWith('265')) return `+${digits}`;
    if (digits.startsWith('0')) return `+265${digits.slice(1)}`;
    return `+${digits}`;
  }
}
