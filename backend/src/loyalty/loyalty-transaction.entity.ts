import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { LoyaltyTxnType } from '../common/enums';
import { LoyaltyAccount } from './loyalty-account.entity';

@Entity('loyalty_transactions')
export class LoyaltyTransaction extends BaseEntity {
  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => LoyaltyAccount, (a) => a.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account!: LoyaltyAccount;

  @Column({ type: 'enum', enum: LoyaltyTxnType })
  type!: LoyaltyTxnType;

  @Column({ type: 'int' })
  points!: number;

  @Column({ name: 'balance_after', type: 'int' })
  balanceAfter!: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description?: string | null;

  @Column({
    name: 'reference_type',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  referenceType?: string | null;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId?: string | null;
}
