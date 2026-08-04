import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { JournalEntry } from './journal-entry.entity';

@Entity('journal_lines')
export class JournalLine extends BaseEntity {
  @Column({ name: 'entry_id' })
  entryId!: string;

  @ManyToOne(() => JournalEntry, (e) => e.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entry_id' })
  entry!: JournalEntry;

  @Column({ name: 'account_code', length: 40 })
  accountCode!: string;

  @Column({ name: 'account_name', length: 160 })
  accountName!: string;

  @Column({
    name: 'debit_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  debitAmount!: string;

  @Column({
    name: 'credit_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  creditAmount!: string;
}
