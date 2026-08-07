import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { SettlementMatchStatus } from '../common/enums';
import { BankAccount } from './bank-account.entity';

@Entity('bank_statement_lines')
export class BankStatementLine extends BaseEntity {
  @Column({ name: 'bank_account_id' })
  bankAccountId!: string;

  @ManyToOne(() => BankAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount!: BankAccount;

  @Column({ name: 'txn_date', type: 'date' })
  txnDate!: string;

  @Column({ length: 120 })
  reference!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: string;

  @Column({
    type: 'enum',
    enum: SettlementMatchStatus,
    default: SettlementMatchStatus.UNMATCHED,
  })
  status!: SettlementMatchStatus;

  @Column({ name: 'matched_entity_type', length: 40, nullable: true })
  matchedEntityType?: string;

  @Column({ name: 'matched_entity_id', type: 'uuid', nullable: true })
  matchedEntityId?: string;
}
