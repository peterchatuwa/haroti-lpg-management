import { Injectable, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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

interface PaychanguCardChargeResponse {
  success?: boolean;
  requires_3ds_auth?: boolean;
  orderReference?: string;
  '3ds_auth_link'?: string;
  message?: string;
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
    this.clientId = this.resolveClientId();
    this.secretKey = this.resolveSecretKey();
    this.baseUrl =
      config.get('PAYCHANGU_BASE_URL') || 'https://api.paychangu.com';
    this.webhookSecret = config.get('PAYCHANGU_WEBHOOK_SECRET') || '';

    if (!this.secretKey) {
      this.logger.warn(
        'PayChangu secret key not configured — set PAYCHANGU_SECRET_KEY (sec-test-… or sec-live-…)',
      );
    }
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
    card?: {
      number: string;
      expiry: string;
      cvv: string;
      cardholderName: string;
      currency?: string;
    };
  }): Promise<PaychanguTransaction> {
    this.logger.log(`Initiating PayChangu payment: amount=${params.amount}, method=${params.paymentMethod}, saleId=${params.saleId}, paycMeterId=${params.paycMeterId}`);
    
    if (!this.secretKey) {
      this.logger.error('PayChangu secret key not configured');
      throw new BadRequestException(
        'PayChangu is not configured. Set PAYCHANGU_SECRET_KEY to your sec-test- or sec-live- key on the server.',
      );
    }

    const paychanguMethod = this.mapPaymentMethod(params.paymentMethod);
    const chargeId = this.generateChargeId();

    this.logger.debug(`Generated charge ID: ${chargeId} for internal ref: ${params.internalRef}`);

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
    this.logger.log(`Created PayChangu transaction ${chargeId} with status PENDING`);

    try {
      if (paychanguMethod === PaychanguPaymentMethod.CARD) {
        if (!params.card) {
          throw new BadRequestException('Card details are required');
        }
        this.logger.debug(`Initiating card charge for ${chargeId}`);
        return await this.initiateCardCharge(saved, {
          amount: params.amount,
          customerEmail: params.customerEmail,
          card: params.card,
        });
      }

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

      this.logger.debug(`Initiating mobile money payment for ${chargeId}, operator: ${paychanguMethod}`);
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

      this.logger.log(`MoMo payment initiated: ${chargeId}, PayChangu ref: ${saved.paychanguReference}`);
      return saved;
    } catch (error: unknown) {
      saved.status = PaychanguTransactionStatus.FAILED;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      saved.metadata = { ...saved.metadata, error: errorMessage };
      await this.txnRepo.save(saved);
      this.logger.error(`Payment initiation failed for ${chargeId}: ${errorMessage}`);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(errorMessage);
    }
  }

  private async initiateCardCharge(
    saved: PaychanguTransaction,
    params: {
      amount: number;
      customerEmail?: string;
      card: {
        number: string;
        expiry: string;
        cvv: string;
        cardholderName: string;
        currency?: string;
      };
    },
  ): Promise<PaychanguTransaction> {
    const chargeId = saved.transactionRef;
    const redirectUrl =
      this.config.get<string>('PAYCHANGU_CARD_REDIRECT_URL') ||
      'https://harotiholdingslimited.com/erp/pos';

    const response = await this.callPaychanguCardApi<PaychanguCardChargeResponse>(
      '/charge-card/payments',
      {
        card_number: params.card.number,
        expiry: params.card.expiry,
        cvv: params.card.cvv,
        cardholder_name: params.card.cardholderName,
        amount: String(params.amount),
        currency: params.card.currency || 'MWK',
        email: params.customerEmail || 'customer@harotiholdingslimited.com',
        charge_id: chargeId,
        redirect_url: redirectUrl,
      },
    );

    saved.paychanguReference = response.orderReference ?? chargeId;
    saved.status = PaychanguTransactionStatus.PROCESSING;
    saved.metadata = {
      ...saved.metadata,
      requires3dsAuth: Boolean(response.requires_3ds_auth),
      threeDsAuthLink: response['3ds_auth_link'],
      orderReference: response.orderReference,
    };
    await this.txnRepo.save(saved);

    this.logger.log(`Card payment initiated: ${chargeId}`);
    return saved;
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
        this.logger.error('Invalid webhook signature received');
        throw new BadRequestException('Invalid webhook signature');
      }
    } else {
      this.logger.warn('PayChangu webhook secret not set — skipping signature check');
    }

    const chargeId = payload.charge_id;
    if (!chargeId) {
      this.logger.error('Missing charge_id in webhook payload', payload);
      throw new BadRequestException('Missing charge_id in webhook payload');
    }

    this.logger.log(`Received webhook for charge ${chargeId}, event: ${payload.event_type}`);

    const webhook = await this.webhookRepo.save(
      this.webhookRepo.create({
        eventType: payload.event_type,
        transactionRef: chargeId,
        payload: payload as unknown as Record<string, unknown>,
        processed: false,
      }),
    );

    // Process webhook synchronously to ensure it completes and catch errors
    try {
      await this.handleWebhookEvent(webhook.id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process webhook ${webhook.id}: ${errorMessage}`);
      // Don't throw - webhook is saved and will be retried if needed
    }

    return webhook;
  }

  private async handleWebhookEvent(webhookId: string): Promise<void> {
    const webhook = await this.webhookRepo.findOne({
      where: { id: webhookId },
    });
    if (!webhook) {
      this.logger.error(`Webhook not found: ${webhookId}`);
      return;
    }
    if (webhook.processed) {
      this.logger.debug(`Webhook ${webhookId} already processed, skipping`);
      return;
    }

    try {
      const { eventType, transactionRef, payload } = webhook;
      this.logger.log(`Processing webhook ${webhookId} for transaction ${transactionRef}, event: ${eventType}`);

      const txn = await this.txnRepo.findOne({
        where: { transactionRef },
        relations: { sale: true, paycMeter: true },
      });

      if (!txn) {
        const error = `Transaction not found: ${transactionRef}`;
        this.logger.error(error);
        throw new Error(error);
      }

      this.logger.debug(`Found transaction ${transactionRef}, current status: ${txn.status}, saleId: ${txn.saleId}, paycMeterId: ${txn.paycMeterId}`);

      // Re-query PayChangu before fulfilling (recommended by their docs).
      this.logger.debug(`Verifying payment status with PayChangu for ${transactionRef}`);
      const verified = await this.verifyChargeOnPaychangu(
        transactionRef,
        txn.paymentMethod,
      );
      const verifiedStatus =
        verified.data?.status ??
        (verified as PaychanguEnvelope).status ??
        payload.status;

      this.logger.log(`Verified status from PayChangu: ${verifiedStatus} (event: ${eventType})`);

      if (
        (eventType === 'api.charge.payment' || eventType === 'payment.completed') &&
        (verifiedStatus === 'success' || verifiedStatus === 'successful')
      ) {
        this.logger.log(`Processing successful payment for ${transactionRef}`);
        await this.handlePaymentCompleted(txn, payload);
      } else if (verifiedStatus === 'failed') {
        this.logger.warn(`Processing failed payment for ${transactionRef}`);
        await this.handlePaymentFailed(txn, payload);
      } else {
        this.logger.warn(`Unhandled PayChangu event: ${eventType} / ${verifiedStatus} for ${transactionRef}`);
      }

      webhook.processed = true;
      webhook.processedAt = new Date();
      await this.webhookRepo.save(webhook);
      this.logger.log(`Successfully processed webhook ${webhookId} for transaction ${transactionRef}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Webhook processing error for webhook ${webhookId}: ${errorMessage}`,
        errorStack,
      );
      webhook.errorMessage = errorMessage;
      await this.webhookRepo.save(webhook);
      throw error; // Re-throw to be caught by processWebhook
    }
  }

  private async handlePaymentCompleted(
    txn: PaychanguTransaction,
    payload: Record<string, unknown>,
  ): Promise<void> {
    // Check if payment was already processed to prevent double-processing
    if (txn.completedAt) {
      this.logger.debug(`Payment ${txn.transactionRef} already completed at ${txn.completedAt}, skipping duplicate processing`);
      return;
    }

    this.logger.log(`Marking payment as completed: ${txn.transactionRef}, amount: ${txn.amount}`);

    txn.status = PaychanguTransactionStatus.COMPLETED;
    txn.completedAt = new Date();
    txn.metadata = { ...txn.metadata, completion_data: payload };
    await this.txnRepo.save(txn);

    this.logger.debug(`Transaction ${txn.transactionRef} saved with COMPLETED status`);

    // Process PAYC meter top-up if applicable
    if (txn.paycMeterId) {
      this.logger.log(`Processing PAYC meter top-up for meter ${txn.paycMeterId}, amount: ${txn.amount} MWK`);
      try {
        await this.paycService.topUpCredit({
          meterId: txn.paycMeterId,
          amountMwk: Number(txn.amount),
          paymentMethod: PaymentMethod.PAYCHANGU,
          reference: txn.transactionRef,
        });
        this.logger.log(`PAYC meter ${txn.paycMeterId} topped up successfully`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to top up PAYC meter ${txn.paycMeterId}: ${errorMessage}`);
        throw error; // Re-throw to mark webhook as failed
      }
    }

    // Complete the sale if applicable
    if (txn.saleId) {
      this.logger.log(`Completing sale ${txn.saleId} for payment ${txn.transactionRef}`);
      try {
        await this.salesService.completePaychanguSale(txn.saleId);
        this.logger.log(`Sale ${txn.saleId} completed successfully`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to complete sale ${txn.saleId}: ${errorMessage}`);
        throw error; // Re-throw to mark webhook as failed
      }
    }

    this.logger.log(`Payment completed successfully: ${txn.transactionRef}`);
  }

  private async handlePaymentFailed(
    txn: PaychanguTransaction,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const reason = payload.status as string | undefined;
    this.logger.warn(`Processing payment failure for ${txn.transactionRef}, reason: ${reason || 'unknown'}`);
    
    if (
      txn.status !== PaychanguTransactionStatus.FAILED &&
      txn.status !== PaychanguTransactionStatus.CANCELLED &&
      txn.status !== PaychanguTransactionStatus.EXPIRED
    ) {
      txn.status = PaychanguTransactionStatus.FAILED;
      txn.metadata = { ...txn.metadata, failure_reason: reason };
      await this.txnRepo.save(txn);
      this.logger.debug(`Transaction ${txn.transactionRef} marked as FAILED`);
    } else {
      this.logger.debug(`Transaction ${txn.transactionRef} already in failed state: ${txn.status}`);
    }

    if (txn.saleId) {
      this.logger.log(`Failing sale ${txn.saleId} due to payment failure`);
      try {
        await this.salesService.failPaychanguSale(txn.saleId, reason);
        this.logger.log(`Sale ${txn.saleId} marked as failed`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to mark sale ${txn.saleId} as failed: ${errorMessage}`);
      }
    }

    this.logger.warn(`Payment failed: ${txn.transactionRef}`);
  }

  async queryPayment(transactionRef: string): Promise<PaychanguTransaction> {
    this.logger.log(`Querying payment status for ${transactionRef}`);
    
    const txn = await this.txnRepo.findOne({ where: { transactionRef } });
    if (!txn) {
      this.logger.error(`Transaction not found: ${transactionRef}`);
      throw new BadRequestException('Transaction not found');
    }

    this.logger.debug(`Current transaction status: ${txn.status}`);

    const response = await this.verifyChargeOnPaychangu(
      transactionRef,
      txn.paymentMethod,
    );
    const remoteStatus =
      response.data?.status ?? (response as PaychanguEnvelope).status ?? '';
    
    this.logger.log(`Remote status from PayChangu: ${remoteStatus}`);
    
    txn.status = this.mapStatusFromPaychangu(remoteStatus);
    if (
      txn.status === PaychanguTransactionStatus.FAILED ||
      txn.status === PaychanguTransactionStatus.CANCELLED ||
      txn.status === PaychanguTransactionStatus.EXPIRED
    ) {
      txn.metadata = {
        ...txn.metadata,
        failure_reason: remoteStatus || txn.metadata?.failure_reason,
      };
    }
    await this.txnRepo.save(txn);

    this.logger.log(`Transaction ${transactionRef} updated to status: ${txn.status}`);
    await this.applyTransactionOutcome(txn, remoteStatus);

    return txn;
  }

  findBySaleId(saleId: string) {
    return this.txnRepo.findOne({
      where: { saleId },
      order: { createdAt: 'DESC' },
    });
  }

  async syncPendingPayments(): Promise<{
    checked: number;
    resolved: number;
    errors: number;
  }> {
    const pending = await this.txnRepo.find({
      where: {
        status: In([
          PaychanguTransactionStatus.PENDING,
          PaychanguTransactionStatus.PROCESSING,
        ]),
      },
      order: { createdAt: 'ASC' },
      take: 100,
    });

    let resolved = 0;
    let errors = 0;

    for (const txn of pending) {
      try {
        const previousStatus = txn.status;
        await this.queryPayment(txn.transactionRef);
        const updated = await this.txnRepo.findOne({
          where: { transactionRef: txn.transactionRef },
        });
        if (updated && updated.status !== previousStatus) {
          resolved++;
        }
      } catch (error: unknown) {
        errors++;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(
          `Pending PayChangu sync failed for ${txn.transactionRef}: ${errorMessage}`,
        );
      }
    }

    return { checked: pending.length, resolved, errors };
  }

  private async applyTransactionOutcome(
    txn: PaychanguTransaction,
    remoteStatus?: string,
  ): Promise<void> {
    if (txn.status === PaychanguTransactionStatus.COMPLETED) {
      await this.handlePaymentCompleted(txn, {});
      return;
    }

    if (
      txn.status === PaychanguTransactionStatus.FAILED ||
      txn.status === PaychanguTransactionStatus.CANCELLED ||
      txn.status === PaychanguTransactionStatus.EXPIRED
    ) {
      await this.handlePaymentFailed(txn, {
        status: remoteStatus ?? txn.metadata?.failure_reason,
      });
    }
  }

  private verifyChargeOnPaychangu(
    chargeId: string,
    method: PaychanguPaymentMethod,
  ) {
    if (method === PaychanguPaymentMethod.CARD) {
      return this.callPaychanguApi<PaychanguEnvelope<PaychanguChargeData>>(
        `/charge-card/verify/${encodeURIComponent(chargeId)}`,
        undefined,
        'GET',
      );
    }
    return this.callPaychanguApi<PaychanguEnvelope<PaychanguChargeData>>(
      `/mobile-money/payments/${encodeURIComponent(chargeId)}/verify`,
      undefined,
      'GET',
    );
  }

  private async callPaychanguCardApi<T>(
    endpoint: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.secretKey}`,
      },
      body: JSON.stringify(body),
    });

    const json = (await response.json().catch(() => ({}))) as T &
      Record<string, unknown>;

    if (!response.ok || json.success === false) {
      const errorMessage =
        typeof json.message === 'string' ? json.message : 'Unknown error';
      throw new BadRequestException(
        `PayChangu card API error (${response.status}): ${errorMessage}`,
      );
    }

    return json as T;
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
      throw new BadRequestException(
        `PayChangu API error (${response.status}): ${errorMessage}`,
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
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('265')) digits = digits.slice(3);
    if (digits.startsWith('0')) digits = digits.slice(1);
    if (digits.length !== 9) {
      throw new BadRequestException(
        'Enter a valid Malawi mobile number (e.g. 0990000000 or 990000000)',
      );
    }
    return `0${digits}`;
  }

  private resolveSecretKey(): string {
    const secret = this.config.get<string>('PAYCHANGU_SECRET_KEY')?.trim();
    if (secret) return secret;

    const apiKey = this.config.get<string>('PAYCHANGU_API_KEY')?.trim();
    if (apiKey?.startsWith('sec-') || apiKey?.startsWith('sk_')) {
      return apiKey;
    }
    return '';
  }

  private resolveClientId(): string {
    const clientId = this.config.get<string>('PAYCHANGU_CLIENT_ID')?.trim();
    if (clientId) return clientId;

    const apiKey = this.config.get<string>('PAYCHANGU_API_KEY')?.trim();
    if (apiKey?.startsWith('pub-') || apiKey?.startsWith('pk_')) {
      return apiKey;
    }
    return '';
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
