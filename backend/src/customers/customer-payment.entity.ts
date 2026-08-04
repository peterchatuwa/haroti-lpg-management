import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { PaymentMethod } from '../common/enums';
import { User } from '../users/user.entity';
import { Customer } from './customer.entity';

@Entity('customer_payments')
export class CustomerPayment extends BaseEntity {
  @Column({ name: 'customer_id' })
  customerId!: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: string;

  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod })
  paymentMethod!: PaymentMethod;

  @Column({ length: 80, nullable: true })
  reference?: string;

  @Column({ name: 'received_by_id' })
  receivedById!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'received_by_id' })
  receivedBy!: User;

  @Column({ name: 'paid_at', type: 'timestamptz' })
  paidAt!: Date;

  @Column({ name: 'client_txn_id', length: 80, nullable: true, unique: true })
  clientTxnId?: string;
}
