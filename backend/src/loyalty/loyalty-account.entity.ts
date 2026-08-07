import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Customer } from '../customers/customer.entity';
import { LoyaltyTransaction } from './loyalty-transaction.entity';

@Entity('loyalty_accounts')
export class LoyaltyAccount extends BaseEntity {
  @Column({ name: 'customer_id', type: 'uuid', unique: true })
  customerId!: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ name: 'points_balance', type: 'int', default: 0 })
  pointsBalance!: number;

  @Column({ name: 'lifetime_earned', type: 'int', default: 0 })
  lifetimeEarned!: number;

  @OneToMany(() => LoyaltyTransaction, (t) => t.account)
  transactions!: LoyaltyTransaction[];
}
