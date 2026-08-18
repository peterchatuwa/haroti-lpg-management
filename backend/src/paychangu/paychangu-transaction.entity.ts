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

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
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
