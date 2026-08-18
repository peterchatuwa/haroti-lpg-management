# PayChangu & PAYC Hardware Integration - Quick Start Guide

**Quick reference for developers implementing the integration**

---

## 🚀 Quick Implementation Checklist

### Prerequisites
- [ ] PayChangu merchant account created
- [ ] API credentials obtained (sandbox + production)
- [ ] Hardware manufacturer documentation received
- [ ] Test meters available
- [ ] Development environment set up

---

## 📋 Phase 1: PayChangu Payment Gateway

### Step 1: Environment Configuration

**Add to `backend/.env`:**
```bash
# PayChangu Configuration
PAYCHANGU_API_KEY=pk_sandbox_xxxxxxxx
PAYCHANGU_SECRET_KEY=sk_sandbox_xxxxxxxx
PAYCHANGU_MERCHANT_ID=HAROTI_GAS_001
PAYCHANGU_WEBHOOK_SECRET=whsec_xxxxxxxx
PAYCHANGU_BASE_URL=https://api.sandbox.paychangu.com/v1
PAYCHANGU_ENVIRONMENT=sandbox
PAYCHANGU_CALLBACK_URL=http://localhost:3000/api/paychangu/webhook
```

### Step 2: Database Migration

**Create migration:**
```bash
cd backend
npm run typeorm migration:create src/database/migrations/PaychanguIntegration
```

**Migration content:**
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaychanguIntegration1724000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create paychangu_transactions table
    await queryRunner.query(`
      CREATE TABLE paychangu_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transaction_ref VARCHAR(100) UNIQUE NOT NULL,
        internal_ref VARCHAR(100) NOT NULL,
        payment_method VARCHAR(30) NOT NULL,
        amount DECIMAL(14,2) NOT NULL,
        status VARCHAR(30) NOT NULL,
        customer_phone VARCHAR(20),
        customer_email VARCHAR(100),
        paychangu_reference VARCHAR(100),
        callback_url VARCHAR(255),
        completed_at TIMESTAMP,
        metadata JSONB,
        sale_id UUID REFERENCES sales(id),
        payc_meter_id UUID REFERENCES payc_meters(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create paychangu_webhooks table
    await queryRunner.query(`
      CREATE TABLE paychangu_webhooks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(60) NOT NULL,
        transaction_ref VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        processed BOOLEAN DEFAULT FALSE,
        processed_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX idx_paychangu_txn_ref ON paychangu_transactions(transaction_ref);
      CREATE INDEX idx_paychangu_txn_status ON paychangu_transactions(status);
      CREATE INDEX idx_paychangu_webhook_processed ON paychangu_webhooks(processed);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE paychangu_webhooks`);
    await queryRunner.query(`DROP TABLE paychangu_transactions`);
  }
}
```

**Run migration:**
```bash
npm run migration:run
```

### Step 3: Create PayChangu Module

**File: `backend/src/paychangu/paychangu.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaychanguService } from './paychangu.service';
import { PaychanguController } from './paychangu.controller';
import { PaychanguTransaction } from './paychangu-transaction.entity';
import { PaychanguWebhook } from './paychangu-webhook.entity';
import { SalesModule } from '../sales/sales.module';
import { PaycModule } from '../payc/payc.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaychanguTransaction, PaychanguWebhook]),
    SalesModule,
    PaycModule,
  ],
  controllers: [PaychanguController],
  providers: [PaychanguService],
  exports: [PaychanguService],
})
export class PaychanguModule {}
```

**Register in `app.module.ts`:**
```typescript
import { PaychanguModule } from './paychangu/paychangu.module';

@Module({
  imports: [
    // ... existing modules
    PaychanguModule,
  ],
})
export class AppModule {}
```

### Step 4: Create Entities & Enums

**File: `backend/src/paychangu/paychangu-transaction.entity.ts`**
```typescript
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Sale } from '../sales/sale.entity';
import { PaycMeter } from '../payc/payc-meter.entity';

export enum PaychanguTransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum PaychanguPaymentMethod {
  AIRTEL_MONEY = 'AIRTEL_MONEY',
  TNM_MPAMBA = 'TNM_MPAMBA',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

@Entity('paychangu_transactions')
export class PaychanguTransaction extends BaseEntity {
  @Column({ name: 'transaction_ref', unique: true })
  transactionRef!: string;

  @Column({ name: 'internal_ref' })
  internalRef!: string;

  @Column({ type: 'enum', enum: PaychanguPaymentMethod, name: 'payment_method' })
  paymentMethod!: PaychanguPaymentMethod;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: string;

  @Column({ type: 'enum', enum: PaychanguTransactionStatus })
  status!: PaychanguTransactionStatus;

  @Column({ name: 'customer_phone', length: 20, nullable: true })
  customerPhone?: string;

  @Column({ name: 'customer_email', length: 100, nullable: true })
  customerEmail?: string;

  @Column({ name: 'paychangu_reference', nullable: true })
  paychanguReference?: string;

  @Column({ name: 'callback_url', nullable: true })
  callbackUrl?: string;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'sale_id', type: 'uuid', nullable: true })
  saleId?: string;

  @ManyToOne(() => Sale, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sale_id' })
  sale?: Sale;

  @Column({ name: 'payc_meter_id', type: 'uuid', nullable: true })
  paycMeterId?: string;

  @ManyToOne(() => PaycMeter, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payc_meter_id' })
  paycMeter?: PaycMeter;
}
```

**File: `backend/src/paychangu/paychangu-webhook.entity.ts`**
```typescript
import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

@Entity('paychangu_webhooks')
export class PaychanguWebhook extends BaseEntity {
  @Column({ name: 'event_type', length: 60 })
  eventType!: string;

  @Column({ name: 'transaction_ref' })
  transactionRef!: string;

  @Column({ name: 'payload', type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ default: false })
  processed!: boolean;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt?: Date;

  @Column({ name: 'error_message', nullable: true })
  errorMessage?: string;
}
```

**Update `backend/src/database/entities.ts`:**
```typescript
import { PaychanguTransaction } from '../paychangu/paychangu-transaction.entity';
import { PaychanguWebhook } from '../paychangu/paychangu-webhook.entity';

export const ENTITIES = [
  // ... existing entities
  PaychanguTransaction,
  PaychanguWebhook,
];
```

### Step 5: Implement PayChangu Service

**File: `backend/src/paychangu/paychangu.service.ts`**
```typescript
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import {
  PaychanguTransaction,
  PaychanguTransactionStatus,
  PaychanguPaymentMethod,
} from './paychangu-transaction.entity';
import { PaychanguWebhook } from './paychangu-webhook.entity';
import { PaymentMethod } from '../common/enums';

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
    this.baseUrl = config.get('PAYCHANGU_BASE_URL') || '';
    this.webhookSecret = config.get('PAYCHANGU_WEBHOOK_SECRET') || '';
  }

  /**
   * Initiate a payment with PayChangu
   */
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
    
    // Map internal payment method to PayChangu method
    const paychanguMethod = this.mapPaymentMethod(params.paymentMethod);

    // Create transaction record
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
      callbackUrl: this.config.get('PAYCHANGU_CALLBACK_URL'),
    });

    const saved = await this.txnRepo.save(txn);

    // Call PayChangu API
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

      // Update with PayChangu response
      saved.paychanguReference = response.payment_reference;
      saved.status = PaychanguTransactionStatus.PROCESSING;
      await this.txnRepo.save(saved);

      this.logger.log(`Payment initiated: ${transactionRef}`);
      return saved;
    } catch (error) {
      saved.status = PaychanguTransactionStatus.FAILED;
      saved.metadata = { ...saved.metadata, error: error.message };
      await this.txnRepo.save(saved);
      throw error;
    }
  }

  /**
   * Process incoming webhook from PayChangu
   */
  async processWebhook(
    payload: any,
    signature: string,
  ): Promise<PaychanguWebhook> {
    // Verify signature
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Save webhook
    const webhook = await this.webhookRepo.save(
      this.webhookRepo.create({
        eventType: payload.event_type,
        transactionRef: payload.transaction_ref,
        payload,
        processed: false,
      }),
    );

    // Process webhook async
    setImmediate(() => this.handleWebhookEvent(webhook.id));

    return webhook;
  }

  /**
   * Handle webhook event processing
   */
  private async handleWebhookEvent(webhookId: string): Promise<void> {
    const webhook = await this.webhookRepo.findOne({ where: { id: webhookId } });
    if (!webhook || webhook.processed) return;

    try {
      const { event_type, transaction_ref, payload } = webhook;

      // Find transaction
      const txn = await this.txnRepo.findOne({
        where: { transactionRef: transaction_ref },
        relations: ['sale', 'paycMeter'],
      });

      if (!txn) {
        throw new Error(`Transaction not found: ${transaction_ref}`);
      }

      // Handle different event types
      switch (event_type) {
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
          this.logger.warn(`Unknown event type: ${event_type}`);
      }

      // Mark webhook as processed
      webhook.processed = true;
      webhook.processedAt = new Date();
      await this.webhookRepo.save(webhook);
    } catch (error) {
      this.logger.error(`Webhook processing error: ${error.message}`, error.stack);
      webhook.errorMessage = error.message;
      await this.webhookRepo.save(webhook);
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentCompleted(
    txn: PaychanguTransaction,
    payload: any,
  ): Promise<void> {
    txn.status = PaychanguTransactionStatus.COMPLETED;
    txn.completedAt = new Date();
    txn.metadata = { ...txn.metadata, completion_data: payload };
    await this.txnRepo.save(txn);

    // TODO: Update sale or PAYC credit
    // This will be implemented when integrating with SalesService/PaycService

    this.logger.log(`Payment completed: ${txn.transactionRef}`);
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(
    txn: PaychanguTransaction,
    payload: any,
  ): Promise<void> {
    txn.status = PaychanguTransactionStatus.FAILED;
    txn.metadata = { ...txn.metadata, failure_reason: payload.reason };
    await this.txnRepo.save(txn);

    this.logger.warn(`Payment failed: ${txn.transactionRef}`);
  }

  /**
   * Handle cancelled payment
   */
  private async handlePaymentCancelled(
    txn: PaychanguTransaction,
    payload: any,
  ): Promise<void> {
    txn.status = PaychanguTransactionStatus.CANCELLED;
    txn.metadata = { ...txn.metadata, cancellation_reason: payload.reason };
    await this.txnRepo.save(txn);

    this.logger.warn(`Payment cancelled: ${txn.transactionRef}`);
  }

  /**
   * Query payment status from PayChangu API
   */
  async queryPayment(transactionRef: string): Promise<PaychanguTransaction> {
    const txn = await this.txnRepo.findOne({ where: { transactionRef } });
    if (!txn) {
      throw new BadRequestException('Transaction not found');
    }

    // Query PayChangu API
    const response = await this.callPaychanguApi(
      `/payments/${transactionRef}/status`,
      null,
      'GET',
    );

    // Update status
    txn.status = this.mapStatusFromPaychangu(response.status);
    if (txn.status === PaychanguTransactionStatus.COMPLETED) {
      txn.completedAt = new Date(response.completed_at);
    }
    await this.txnRepo.save(txn);

    return txn;
  }

  /**
   * Call PayChangu API
   */
  private async callPaychanguApi(
    endpoint: string,
    data?: any,
    method: 'GET' | 'POST' = 'POST',
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
    };

    if (data && method === 'POST') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`PayChangu API error: ${error.message}`);
    }

    return response.json();
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(payload: any, signature: string): boolean {
    const expected = createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    return signature === expected;
  }

  /**
   * Generate unique transaction reference
   */
  private generateTransactionRef(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `HAROTI-${timestamp}-${random}`;
  }

  /**
   * Map internal payment method to PayChangu method
   */
  private mapPaymentMethod(method: PaymentMethod): PaychanguPaymentMethod {
    const mapping: Record<string, PaychanguPaymentMethod> = {
      [PaymentMethod.AIRTEL_MONEY]: PaychanguPaymentMethod.AIRTEL_MONEY,
      [PaymentMethod.TNM_MPAMBA]: PaychanguPaymentMethod.TNM_MPAMBA,
      [PaymentMethod.CARD]: PaychanguPaymentMethod.CARD,
      [PaymentMethod.BANK_TRANSFER]: PaychanguPaymentMethod.BANK_TRANSFER,
    };
    
    const mapped = mapping[method];
    if (!mapped) {
      throw new BadRequestException(`Unsupported payment method: ${method}`);
    }
    return mapped;
  }

  /**
   * Map PayChangu status to internal status
   */
  private mapStatusFromPaychangu(status: string): PaychanguTransactionStatus {
    const mapping: Record<string, PaychanguTransactionStatus> = {
      'pending': PaychanguTransactionStatus.PENDING,
      'processing': PaychanguTransactionStatus.PROCESSING,
      'completed': PaychanguTransactionStatus.COMPLETED,
      'failed': PaychanguTransactionStatus.FAILED,
      'cancelled': PaychanguTransactionStatus.CANCELLED,
      'expired': PaychanguTransactionStatus.EXPIRED,
    };
    return mapping[status.toLowerCase()] || PaychanguTransactionStatus.PENDING;
  }
}
```

### Step 6: Create Controller

**File: `backend/src/paychangu/paychangu.controller.ts`**
```typescript
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaychanguService } from './paychangu.service';

@Controller('paychangu')
export class PaychanguController {
  constructor(private readonly paychanguService: PaychanguService) {}

  /**
   * Webhook endpoint (no auth - verified by signature)
   */
  @Post('webhook')
  async webhook(
    @Body() payload: any,
    @Headers('x-paychangu-signature') signature: string,
  ) {
    return this.paychanguService.processWebhook(payload, signature);
  }

  /**
   * Query payment status
   */
  @UseGuards(JwtAuthGuard)
  @Get('transactions/:ref/status')
  async queryPayment(@Param('ref') ref: string) {
    return this.paychanguService.queryPayment(ref);
  }

  /**
   * List transactions
   */
  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  async listTransactions() {
    // TODO: Implement pagination
    return { message: 'List transactions endpoint' };
  }
}
```

### Step 7: Test Integration

**Create test file: `backend/src/paychangu/paychangu.service.spec.ts`**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaychanguService } from './paychangu.service';
import { PaychanguTransaction } from './paychangu-transaction.entity';
import { PaychanguWebhook } from './paychangu-webhook.entity';

describe('PaychanguService', () => {
  let service: PaychanguService;

  const mockTxnRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockWebhookRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        PAYCHANGU_API_KEY: 'test_key',
        PAYCHANGU_SECRET_KEY: 'test_secret',
        PAYCHANGU_BASE_URL: 'https://sandbox.paychangu.com',
        PAYCHANGU_WEBHOOK_SECRET: 'test_webhook_secret',
        PAYCHANGU_CALLBACK_URL: 'http://localhost:3000/api/paychangu/webhook',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaychanguService,
        {
          provide: getRepositoryToken(PaychanguTransaction),
          useValue: mockTxnRepo,
        },
        {
          provide: getRepositoryToken(PaychanguWebhook),
          useValue: mockWebhookRepo,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PaychanguService>(PaychanguService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more tests here
});
```

**Run tests:**
```bash
npm run test
```

---

## 📋 Phase 2: PAYC Hardware Integration

### Step 1: Research Hardware Manufacturer

**Information to gather:**
1. Manufacturer name and contact
2. Communication protocol (MQTT, HTTP, CoAP, LoRaWAN)
3. Authentication mechanism
4. Data format (JSON, Binary, Protobuf)
5. Telemetry frequency
6. Command support (valve control, credit sync)

**Document findings in:**
`docs/PAYC_HARDWARE_SPECS.md`

### Step 2: Create Hardware Adapter

**File: `backend/src/payc/hardware/payc-hardware.interface.ts`**
```typescript
export interface TelemetryPacket {
  meterSerial: string;
  timestamp: Date;
  creditRemainingKg: number;
  dailyBurnKg: number;
  cumulativeBurnKg: number;
  valveOpen: boolean;
  batteryLevel?: number;
  signalStrength?: number;
  tamperDetected?: boolean;
  errorCodes?: string[];
}

export interface IPaycHardwareAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  parseTelemetry(raw: any): TelemetryPacket;
  sendCommand(meterSerial: string, command: MeterCommand): Promise<void>;
  syncCredit(meterSerial: string, creditKg: number): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export interface MeterCommand {
  type: 'VALVE_OPEN' | 'VALVE_CLOSE' | 'SYNC_CREDIT' | 'FIRMWARE_UPDATE';
  payload: any;
}
```

**File: `backend/src/payc/hardware/generic-mqtt.adapter.ts`**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaycHardwareAdapter, TelemetryPacket, MeterCommand } from './payc-hardware.interface';
import * as mqtt from 'mqtt'; // npm install mqtt

@Injectable()
export class GenericMqttAdapter implements IPaycHardwareAdapter {
  private readonly logger = new Logger(GenericMqttAdapter.name);
  private client: mqtt.MqttClient | null = null;

  constructor(private readonly config: ConfigService) {}

  async connect(): Promise<void> {
    const broker = this.config.get('PAYC_MQTT_BROKER');
    const username = this.config.get('PAYC_MQTT_USERNAME');
    const password = this.config.get('PAYC_MQTT_PASSWORD');

    this.client = mqtt.connect(broker, {
      username,
      password,
    });

    return new Promise((resolve, reject) => {
      this.client.on('connect', () => {
        this.logger.log('Connected to MQTT broker');
        
        // Subscribe to telemetry topic
        this.client.subscribe('payc/+/telemetry', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      this.client.on('error', (err) => {
        this.logger.error('MQTT connection error', err);
        reject(err);
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }

  parseTelemetry(raw: any): TelemetryPacket {
    // Adapt to specific manufacturer format
    return {
      meterSerial: raw.meter_serial || raw.deviceId,
      timestamp: new Date(raw.timestamp),
      creditRemainingKg: parseFloat(raw.credit_remaining || 0),
      dailyBurnKg: parseFloat(raw.daily_burn || 0),
      cumulativeBurnKg: parseFloat(raw.cumulative_burn || 0),
      valveOpen: raw.valve_open === true,
      batteryLevel: raw.battery_level,
      signalStrength: raw.signal_strength,
      tamperDetected: raw.tamper_detected === true,
      errorCodes: raw.error_codes || [],
    };
  }

  async sendCommand(meterSerial: string, command: MeterCommand): Promise<void> {
    if (!this.client) {
      throw new Error('MQTT client not connected');
    }

    const topic = `payc/${meterSerial}/commands`;
    const payload = JSON.stringify(command);

    return new Promise((resolve, reject) => {
      this.client.publish(topic, payload, (err) => {
        if (err) reject(err);
        else {
          this.logger.log(`Command sent to ${meterSerial}: ${command.type}`);
          resolve();
        }
      });
    });
  }

  async syncCredit(meterSerial: string, creditKg: number): Promise<void> {
    await this.sendCommand(meterSerial, {
      type: 'SYNC_CREDIT',
      payload: { creditKg },
    });
  }

  async healthCheck(): Promise<boolean> {
    return this.client?.connected || false;
  }
}
```

### Step 3: Integrate with PaycService

**Update `backend/src/payc/payc.service.ts`:**
```typescript
import { GenericMqttAdapter } from './hardware/generic-mqtt.adapter';

@Injectable()
export class PaycService {
  constructor(
    // ... existing repos
    private readonly hardwareAdapter: GenericMqttAdapter,
  ) {
    // Initialize hardware connection
    this.hardwareAdapter.connect().catch(err => {
      this.logger.error('Failed to connect hardware adapter', err);
    });
  }

  async topUpCredit(params: {
    meterId: string;
    amountMwk: number;
    paymentMethod: PaymentMethod;
    reference?: string;
  }) {
    // ... existing logic
    
    // Sync credit to hardware
    try {
      await this.hardwareAdapter.syncCredit(
        meter.meterSerial,
        toNumber(meter.creditBalanceKg),
      );
      this.logger.log(`Credit synced to meter ${meter.meterSerial}`);
    } catch (error) {
      this.logger.error(`Failed to sync credit to meter: ${error.message}`);
      // Don't fail the top-up if hardware sync fails
    }

    return meter;
  }

  // New method: Handle incoming telemetry via MQTT
  async handleHardwareTelemetry(raw: any): Promise<void> {
    const packet = this.hardwareAdapter.parseTelemetry(raw);
    await this.ingestTelemetry(packet);
  }
}
```

---

## 🧪 Testing Guide

### Manual Testing Checklist

**PayChangu Integration:**
- [ ] Initiate Airtel Money payment
- [ ] Initiate TNM Mpamba payment
- [ ] Test webhook delivery
- [ ] Test failed payment scenario
- [ ] Test cancelled payment scenario
- [ ] Query payment status via API

**PAYC Hardware:**
- [ ] Receive telemetry from test meter
- [ ] Parse telemetry correctly
- [ ] Send valve control command
- [ ] Sync credit to meter
- [ ] Handle offline meter scenario

### Automated Test Commands
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov
```

---

## 📊 Monitoring & Troubleshooting

### Key Metrics to Monitor

1. **PayChangu Payment Success Rate**
   ```sql
   SELECT 
     status,
     COUNT(*) as count,
     ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
   FROM paychangu_transactions
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY status;
   ```

2. **Webhook Processing Health**
   ```sql
   SELECT 
     processed,
     COUNT(*) as count
   FROM paychangu_webhooks
   WHERE created_at > NOW() - INTERVAL '1 hour'
   GROUP BY processed;
   ```

3. **PAYC Meter Connectivity**
   ```sql
   SELECT 
     status,
     COUNT(*) as count
   FROM payc_meters
   GROUP BY status;
   ```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Webhook not received | Firewall blocking | Check webhook URL is publicly accessible |
| Payment stuck in PENDING | PayChangu API timeout | Implement reconciliation job |
| Meter not receiving credit | MQTT connection lost | Reconnect adapter, check credentials |
| Duplicate webhook processing | No idempotency | Add transaction locking |

---

## 🚀 Deployment Commands

```bash
# 1. Build backend
cd backend
npm run build

# 2. Run migrations
npm run migration:run

# 3. Start production
docker compose -f docker-compose.prod.yml up -d --build

# 4. Check logs
docker logs haroti-lpg-api -f

# 5. Verify health
curl https://erp.harotiholdingslimited.com/api/health
```

---

## 📞 Support Contacts

- **PayChangu Support**: support@paychangu.com
- **Hardware Manufacturer**: [TBD]
- **Technical Lead**: [TBD]
- **Operations Manager**: [TBD]

---

**End of Quick Start Guide**
