import { Injectable, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac, randomBytes } from 'crypto';
import {
  PaychanguTransaction,
  PaychanguTransactionStatus,
  PaychanguPaymentMethod,
} from './paychangu-transaction.entity';
import { PaychanguWebhook } from './paychangu-webhook.entity';
import { PaymentMethod } from '../common/enums';
import { PaycService } from '../payc/payc.service';
import { SalesService } from '../sales/sales.service';

interface PaychanguEnvelope<T = unknown> {
  status: string;
  message?: string;
  data?: T;
}

interface PaychanguChargeData {
  charge_id?: string;
  ref_id?: string;
  trans_id?: string;
  status?: string;
  amount?: number;
  mobile?: string;
}

interface PaychanguWebhookPayload {
  event_type: string;
  charge_id?: string;
  status?: string;
  amount?: number;
  reference?: string;
  [key: string]: unknown;
}

const MOMO_OPERATOR_REF: Record<PaychanguPaymentMethod, string> = {
  [PaychanguPaymentMethod.AIRTEL_MONEY]:
    '20be6c20-adeb-4b5b-a7ba-0769820df4fb',
  [PaychanguPaymentMethod.TNM_MPAMBA]:
    '27494cb5-ba9e-437f-a114-4e7a7686bcca',
  [PaychanguPaymentMethod.CARD]: '',
  [PaychanguPaymentMethod.BANK_TRANSFER]: '',
};

@Injectable()
export class PaychanguService {
  private readonly logger = new Logger(PaychanguService.name);
  private readonly clientId: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(PaychanguTransaction)
    private readonly txnRepo: Repository<PaychanguTransaction>,
    @InjectRepository(PaychanguWebhook)
    private readonly webhookRepo: Repository<PaychanguWebhook>,
    private readonly paycService: PaycService,
    @Inject(forwardRef(() => SalesService))
    private readonly salesService: SalesService,
  ) {
    this.clientId =
      config.get('PAYCHANGU_API_KEY') ||
      config.get('PAYCHANGU_CLIENT_ID') ||
      '';
    this.secretKey =
      config.get('PAYCHANGU_SECRET_KEY') ||
      config.get('PAYCHANGU_API_KEY') ||
      '';
    this.baseUrl =
      config.get('PAYCHANGU_BASE_URL') || 'https://api.paychangu.com';
    this.webhookSecret = config.get('PAYCHANGU_WEBHOOK_SECRET') || '';
  }

  async initiatePayment(params: {
    amount: number;
    paymentMethod: PaymentMethod;
    customerPhone?: string;
    customerEmail?: string;
    internalRef: string;
    saleId?: string;
    paycMeterId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaychanguTransaction> {
    if (!this.secretKey) {
      throw new BadRequestException('PayChangu is not configured');
    }

    const paychanguMethod = this.mapPaymentMethod(params.paymentMethod);
    const chargeId = this.generateChargeId();

    const txn = this.txnRepo.create({
      transactionRef: chargeId,
      internalRef: params.internalRef,
      paymentMethod: paychanguMethod,
      amount: params.amount.toString(),
      status: PaychanguTransactionStatus.PENDING,
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail,
      saleId: params.saleId,
      paycMeterId: params.paycMeterId,
      metadata: { ...params.metadata, client_id: this.clientId || undefined },
      callbackUrl: this.config.get<string>('PAYCHANGU_CALLBACK_URL'),
    });

    const saved = await this.txnRepo.save(txn);

    try {
      const operatorRef = MOMO_OPERATOR_REF[paychanguMethod];
      if (!operatorRef) {
        throw new BadRequestException(
          `PayChangu direct charge not implemented for ${paychanguMethod}`,
        );
      }
      if (!params.customerPhone) {
        throw new BadRequestException(
          'Customer phone is required for mobile money payments',
        );
      }

      const response = await this.callPaychanguApi<
        PaychanguEnvelope<PaychanguChargeData>
      >('/mobile-money/payments/initialize', {
        mobile: this.normalizePhone(params.customerPhone),
        mobile_money_operator_ref_id: operatorRef,
        amount: String(params.amount),
        charge_id: chargeId,
        email: params.customerEmail,
      });

      const data = response.data;
      saved.paychanguReference = data?.ref_id ?? data?.trans_id ?? chargeId;
      saved.status = PaychanguTransactionStatus.PROCESSING;
      await this.txnRepo.save(saved);

      this.logger.log(`Payment initiated: ${chargeId}`);
      return saved;
    } catch (error: unknown) {
      saved.status = PaychanguTransactionStatus.FAILED;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      saved.metadata = { ...saved.metadata, error: errorMessage };
      await this.txnRepo.save(saved);
      throw error;
    }
  }

  async processWebhook(
    payload: PaychanguWebhookPayload,
    signature?: string,
    rawBody?: string,
  ): Promise<PaychanguWebhook> {
    const secret = this.webhookSecret || this.secretKey;
    if (secret) {
      const bodyForSig = rawBody ?? JSON.stringify(payload);
      if (!signature || !this.verifyWebhookSignature(bodyForSig, signature, secret)) {
        throw new BadRequestException('Invalid webhook signature');
      }
    } else {
      this.logger.warn('PayChangu webhook secret not set — skipping signature check');
    }

    const chargeId = payload.charge_id;
    if (!chargeId) {
      throw new BadRequestException('Missing charge_id in webhook payload');
    }

    const webhook = await this.webhookRepo.save(
      this.webhookRepo.create({
        eventType: payload.event_type,
        transactionRef: chargeId,
        payload: payload as unknown as Record<string, unknown>,
        processed: false,
      }),
    );

    void this.handleWebhookEvent(webhook.id);

    return webhook;
  }

  private async handleWebhookEvent(webhookId: string): Promise<void> {
    const webhook = await this.webhookRepo.findOne({
      where: { id: webhookId },
    });
    if (!webhook || webhook.processed) return;

    try {
      const { eventType, transactionRef, payload } = webhook;

      const txn = await this.txnRepo.findOne({
        where: { transactionRef },
        relations: { sale: true, paycMeter: true },
      });

      if (!txn) {
        throw new Error(`Transaction not found: ${transactionRef}`);
      }

      // Re-query PayChangu before fulfilling (recommended by their docs).
      const verified = await this.verifyChargeOnPaychangu(transactionRef);
      const verifiedStatus = verified.data?.status ?? payload.status;

      if (
        eventType === 'api.charge.payment' &&
        verifiedStatus === 'success'
      ) {
        await this.handlePaymentCompleted(txn, payload);
      } else if (verifiedStatus === 'failed') {
        await this.handlePaymentFailed(txn, payload);
      } else {
        this.logger.warn(`Unhandled PayChangu event: ${eventType} / ${verifiedStatus}`);
      }

      webhook.processed = true;
      webhook.processedAt = new Date();
      await this.webhookRepo.save(webhook);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Webhook processing error: ${errorMessage}`,
        errorStack,
      );
      webhook.errorMessage = errorMessage;
      await this.webhookRepo.save(webhook);
    }
  }

  private async handlePaymentCompleted(
    txn: PaychanguTransaction,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (txn.status === PaychanguTransactionStatus.COMPLETED) return;

    txn.status = PaychanguTransactionStatus.COMPLETED;
    txn.completedAt = new Date();
    txn.metadata = { ...txn.metadata, completion_data: payload };
    await this.txnRepo.save(txn);

    if (txn.paycMeterId) {
      await this.paycService.topUpCredit({
        meterId: txn.paycMeterId,
        amountMwk: Number(txn.amount),
        paymentMethod: PaymentMethod.PAYCHANGU,
        reference: txn.transactionRef,
      });
    }

    if (txn.saleId) {
      await this.salesService.completePaychanguSale(txn.saleId);
    }

    this.logger.log(`Payment completed: ${txn.transactionRef}`);
  }

  private async handlePaymentFailed(
    txn: PaychanguTransaction,
    payload: Record<string, unknown>,
  ): Promise<void> {
    txn.status = PaychanguTransactionStatus.FAILED;
    txn.metadata = {
      ...txn.metadata,
      failure_reason: payload.status as string | undefined,
    };
    await this.txnRepo.save(txn);

    if (txn.saleId) {
      await this.salesService.failPaychanguSale(
        txn.saleId,
        payload.status as string | undefined,
      );
    }

    this.logger.warn(`Payment failed: ${txn.transactionRef}`);
  }

  async queryPayment(transactionRef: string): Promise<PaychanguTransaction> {
    const txn = await this.txnRepo.findOne({ where: { transactionRef } });
    if (!txn) {
      throw new BadRequestException('Transaction not found');
    }

    const response = await this.verifyChargeOnPaychangu(transactionRef);
    txn.status = this.mapStatusFromPaychangu(response.data?.status ?? '');
    if (
      txn.status === PaychanguTransactionStatus.COMPLETED &&
      !txn.completedAt
    ) {
      txn.completedAt = new Date();
    }
    await this.txnRepo.save(txn);

    return txn;
  }

  private verifyChargeOnPaychangu(chargeId: string) {
    return this.callPaychanguApi<PaychanguEnvelope<PaychanguChargeData>>(
      `/mobile-money/payments/${encodeURIComponent(chargeId)}/verify`,
      undefined,
      'GET',
    );
  }

  private async callPaychanguApi<T>(
    endpoint: string,
    body?: Record<string, unknown>,
    method: 'POST' | 'GET' = 'POST',
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.secretKey}`,
      },
    };

    if (body && method === 'POST') {
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json',
      };
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const json = (await response.json().catch(() => ({}))) as PaychanguEnvelope &
      Record<string, unknown>;

    if (!response.ok || json.status === 'failed') {
      const errorMessage =
        typeof json.message === 'string' ? json.message : 'Unknown error';
      throw new Error(
        `PayChangu API error: ${response.status} - ${errorMessage}`,
      );
    }

    return json as T;
  }

  private verifyWebhookSignature(
    rawPayload: string,
    signature: string,
    secret: string,
  ): boolean {
    const computed = createHmac('sha256', secret)
      .update(rawPayload)
      .digest('hex');
    return computed === signature;
  }

  private generateChargeId(): string {
    return `HAR-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('265')) return `+${digits}`;
    if (digits.startsWith('0')) return `+265${digits.slice(1)}`;
    return `+265${digits}`;
  }

  private mapPaymentMethod(method: PaymentMethod): PaychanguPaymentMethod {
    const mapping: Record<string, PaychanguPaymentMethod> = {
      [PaymentMethod.AIRTEL_MONEY]: PaychanguPaymentMethod.AIRTEL_MONEY,
      [PaymentMethod.TNM_MPAMBA]: PaychanguPaymentMethod.TNM_MPAMBA,
      [PaymentMethod.CARD]: PaychanguPaymentMethod.CARD,
      [PaymentMethod.BANK_TRANSFER]: PaychanguPaymentMethod.BANK_TRANSFER,
      [PaymentMethod.PAYCHANGU]: PaychanguPaymentMethod.AIRTEL_MONEY,
    };

    if (!mapping[method]) {
      throw new BadRequestException(`Unsupported payment method: ${method}`);
    }

    return mapping[method];
  }

  private mapStatusFromPaychangu(status: string): PaychanguTransactionStatus {
    const normalized = status.toLowerCase();
    const mapping: Record<string, PaychanguTransactionStatus> = {
      pending: PaychanguTransactionStatus.PENDING,
      processing: PaychanguTransactionStatus.PROCESSING,
      success: PaychanguTransactionStatus.COMPLETED,
      successful: PaychanguTransactionStatus.COMPLETED,
      completed: PaychanguTransactionStatus.COMPLETED,
      failed: PaychanguTransactionStatus.FAILED,
      cancelled: PaychanguTransactionStatus.CANCELLED,
      expired: PaychanguTransactionStatus.EXPIRED,
    };

    return mapping[normalized] || PaychanguTransactionStatus.PENDING;
  }
}
