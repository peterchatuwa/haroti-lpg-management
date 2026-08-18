import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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

interface PaychanguApiResponse {
  payment_reference: string;
  status: string;
  message?: string;
}

interface PaychanguWebhookPayload {
  event_type: string;
  transaction_ref: string;
  reason?: string;
  [key: string]: unknown;
}

@Injectable()
export class PaychanguService {
  private readonly logger = new Logger(PaychanguService.name);
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(PaychanguTransaction)
    private readonly txnRepo: Repository<PaychanguTransaction>,
    @InjectRepository(PaychanguWebhook)
    private readonly webhookRepo: Repository<PaychanguWebhook>,
  ) {
    this.apiKey = config.get('PAYCHANGU_API_KEY') || '';
    this.secretKey = config.get('PAYCHANGU_SECRET_KEY') || '';
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
    metadata?: Record<string, any>;
  }): Promise<PaychanguTransaction> {
    const transactionRef = this.generateTransactionRef();

    const paychanguMethod = this.mapPaymentMethod(params.paymentMethod);

    const txn = this.txnRepo.create({
      transactionRef,
      internalRef: params.internalRef,
      paymentMethod: paychanguMethod,
      amount: params.amount.toString(),
      status: PaychanguTransactionStatus.PENDING,
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail,
      saleId: params.saleId,
      paycMeterId: params.paycMeterId,
      metadata: params.metadata,
      callbackUrl: this.config.get<string>('PAYCHANGU_CALLBACK_URL'),
    });

    const saved = await this.txnRepo.save(txn);

    try {
      const response = await this.callPaychanguApi('/payments/initiate', {
        transaction_ref: transactionRef,
        amount: params.amount,
        payment_method: paychanguMethod,
        customer_phone: params.customerPhone,
        customer_email: params.customerEmail,
        callback_url: saved.callbackUrl,
        metadata: {
          internal_ref: params.internalRef,
          sale_id: params.saleId,
          payc_meter_id: params.paycMeterId,
        },
      });

      saved.paychanguReference = response.payment_reference;
      saved.status = PaychanguTransactionStatus.PROCESSING;
      await this.txnRepo.save(saved);

      this.logger.log(`Payment initiated: ${transactionRef}`);
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
    signature: string,
  ): Promise<PaychanguWebhook> {
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const webhook = await this.webhookRepo.save(
      this.webhookRepo.create({
        eventType: payload.event_type,
        transactionRef: payload.transaction_ref,
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

      switch (eventType) {
        case 'payment.completed':
          await this.handlePaymentCompleted(txn, payload);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(txn, payload);
          break;
        case 'payment.cancelled':
          await this.handlePaymentCancelled(txn, payload);
          break;
        default:
          this.logger.warn(`Unknown event type: ${eventType}`);
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
    txn.status = PaychanguTransactionStatus.COMPLETED;
    txn.completedAt = new Date();
    txn.metadata = { ...txn.metadata, completion_data: payload };
    await this.txnRepo.save(txn);

    this.logger.log(`Payment completed: ${txn.transactionRef}`);
  }

  private async handlePaymentFailed(
    txn: PaychanguTransaction,
    payload: Record<string, unknown>,
  ): Promise<void> {
    txn.status = PaychanguTransactionStatus.FAILED;
    txn.metadata = {
      ...txn.metadata,
      failure_reason: payload.reason as string | undefined,
    };
    await this.txnRepo.save(txn);

    this.logger.warn(`Payment failed: ${txn.transactionRef}`);
  }

  private async handlePaymentCancelled(
    txn: PaychanguTransaction,
    payload: Record<string, unknown>,
  ): Promise<void> {
    txn.status = PaychanguTransactionStatus.CANCELLED;
    txn.metadata = {
      ...txn.metadata,
      cancellation_reason: payload.reason as string | undefined,
    };
    await this.txnRepo.save(txn);

    this.logger.warn(`Payment cancelled: ${txn.transactionRef}`);
  }

  async queryPayment(transactionRef: string): Promise<PaychanguTransaction> {
    const txn = await this.txnRepo.findOne({ where: { transactionRef } });
    if (!txn) {
      throw new BadRequestException('Transaction not found');
    }

    const response = await this.callPaychanguApi(
      `/payments/${transactionRef}/status`,
      undefined,
      'GET',
    );

    txn.status = this.mapStatusFromPaychangu(response.status);
    if (
      txn.status === PaychanguTransactionStatus.COMPLETED &&
      !txn.completedAt
    ) {
      txn.completedAt = new Date();
    }
    await this.txnRepo.save(txn);

    return txn;
  }

  private async callPaychanguApi(
    endpoint: string,
    body?: Record<string, unknown>,
    method: 'POST' | 'GET' = 'POST',
  ): Promise<PaychanguApiResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    const timestamp = Date.now().toString();
    const signature = this.generateSignature(endpoint, body, timestamp);

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-Timestamp': timestamp,
        'X-Signature': signature,
      },
    };

    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData: unknown = await response
        .json()
        .catch(() => ({} as Record<string, unknown>));
      const errorMessage =
        typeof (errorData as Record<string, unknown>).message === 'string'
          ? (errorData as Record<string, unknown>).message
          : 'Unknown error';
      throw new Error(
        `PayChangu API error: ${response.status} - ${errorMessage as string}`,
      );
    }

    return response.json() as Promise<PaychanguApiResponse>;
  }

  private generateSignature(
    endpoint: string,
    body: Record<string, unknown> | undefined,
    timestamp: string,
  ): string {
    const payload = `${endpoint}${JSON.stringify(body || {})}${timestamp}`;
    return createHmac('sha256', this.secretKey).update(payload).digest('hex');
  }

  private verifyWebhookSignature(
    payload: PaychanguWebhookPayload,
    signature: string,
  ): boolean {
    const computed = createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    return computed === signature;
  }

  private generateTransactionRef(): string {
    return `PYC-${Date.now()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private mapPaymentMethod(method: PaymentMethod): PaychanguPaymentMethod {
    const mapping: Record<string, PaychanguPaymentMethod> = {
      [PaymentMethod.AIRTEL_MONEY]: PaychanguPaymentMethod.AIRTEL_MONEY,
      [PaymentMethod.TNM_MPAMBA]: PaychanguPaymentMethod.TNM_MPAMBA,
      [PaymentMethod.CARD]: PaychanguPaymentMethod.CARD,
      [PaymentMethod.BANK_TRANSFER]: PaychanguPaymentMethod.BANK_TRANSFER,
    };

    if (!mapping[method]) {
      throw new BadRequestException(`Unsupported payment method: ${method}`);
    }

    return mapping[method];
  }

  private mapStatusFromPaychangu(status: string): PaychanguTransactionStatus {
    const mapping: Record<string, PaychanguTransactionStatus> = {
      pending: PaychanguTransactionStatus.PENDING,
      processing: PaychanguTransactionStatus.PROCESSING,
      completed: PaychanguTransactionStatus.COMPLETED,
      failed: PaychanguTransactionStatus.FAILED,
      cancelled: PaychanguTransactionStatus.CANCELLED,
      expired: PaychanguTransactionStatus.EXPIRED,
    };

    return mapping[status.toLowerCase()] || PaychanguTransactionStatus.PENDING;
  }
}
