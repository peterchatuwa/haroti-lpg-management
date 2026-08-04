import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { PaycCreditTxnType, PaymentMethod } from '../common/enums';
import { PaycMeter } from './payc-meter.entity';

@Entity('payc_credit_transactions')
export class PaycCreditTransaction extends BaseEntity {
  @Column({ name: 'meter_id' })
  meterId!: string;

  @ManyToOne(() => PaycMeter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meter_id' })
  meter!: PaycMeter;

  @Column({ type: 'enum', enum: PaycCreditTxnType })
  type!: PaycCreditTxnType;

  @Column({
    name: 'amount_mwk',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  amountMwk!: string;

  @Column({
    name: 'credit_kg',
    type: 'decimal',
    precision: 10,
    scale: 3,
    default: 0,
  })
  creditKg!: string;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod?: PaymentMethod | null;

  @Column({ length: 80, nullable: true })
  reference?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
