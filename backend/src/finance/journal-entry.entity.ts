import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Currency, JournalEventType } from '../common/enums';
import { JournalLine } from './journal-line.entity';

@Entity('journal_entries')
export class JournalEntry extends BaseEntity {
  @Column({ name: 'entry_number', unique: true, length: 40 })
  entryNumber!: string;

  @Column({ type: 'enum', enum: JournalEventType })
  eventType!: JournalEventType;

  @Column({ name: 'reference_type', length: 60, nullable: true })
  referenceType?: string;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId?: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: Currency, default: Currency.MWK })
  currency!: Currency;

  @Column({ name: 'posted_at', type: 'timestamptz', default: () => 'NOW()' })
  postedAt!: Date;

  @OneToMany(() => JournalLine, (line) => line.entry, { cascade: true })
  lines!: JournalLine[];
}
