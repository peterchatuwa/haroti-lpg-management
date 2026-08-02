import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { PaymentMethod, SaleStatus } from '../common/enums';
import { Customer } from '../customers/customer.entity';
import { Station } from '../stations/station.entity';
import { User } from '../users/user.entity';
import { SaleItem } from './sale-item.entity';
import { SalePayment } from './sale-payment.entity';

@Entity('sales')
export class Sale extends BaseEntity {
  @Column({ name: 'receipt_number', unique: true, length: 40 })
  receiptNumber!: string;

  @Column({ name: 'station_id' })
  stationId!: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station!: Station;

  @Column({ name: 'attendant_id' })
  attendantId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'attendant_id' })
  attendant!: User;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId?: string | null;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;

  @Column({ name: 'shift_id', type: 'uuid', nullable: true })
  shiftId?: string | null;

  @Column({
    name: 'subtotal',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  subtotal!: string;

  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  discountAmount!: string;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  totalAmount!: string;

  @Column({
    name: 'lpg_quantity_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  lpgQuantityKg!: string;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.COMPLETED })
  status!: SaleStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'client_txn_id', length: 80, nullable: true, unique: true })
  clientTxnId?: string;

  @Column({ name: 'sold_at', type: 'timestamptz', default: () => 'NOW()' })
  soldAt!: Date;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true })
  items!: SaleItem[];

  @OneToMany(() => SalePayment, (payment) => payment.sale, { cascade: true })
  payments!: SalePayment[];
}