import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { JournalEventType } from '../common/enums';

@Entity('posting_rules')
export class PostingRule extends BaseEntity {
  @Column({ type: 'enum', enum: JournalEventType })
  eventType!: JournalEventType;

  @Column({ name: 'line_role', length: 40 })
  lineRole!: string;

  @Column({ name: 'account_code', length: 10 })
  accountCode!: string;

  @Column({ name: 'account_name', length: 120 })
  accountName!: string;

  @Column({ length: 10, default: 'DEBIT' })
  side!: 'DEBIT' | 'CREDIT';

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: string;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 1 })
  version!: number;
}
