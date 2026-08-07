import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { FiscalPeriodStatus } from '../common/enums';

@Entity('fiscal_periods')
export class FiscalPeriod extends BaseEntity {
  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'int' })
  period!: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: string;

  @Column({
    type: 'enum',
    enum: FiscalPeriodStatus,
    default: FiscalPeriodStatus.OPEN,
  })
  status!: FiscalPeriodStatus;

  @Column({ name: 'closed_by_id', type: 'uuid', nullable: true })
  closedById?: string;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt?: Date;
}
