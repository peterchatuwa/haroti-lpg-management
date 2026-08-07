import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import {
  TargetMetric,
  TargetPeriod,
  TargetScope,
} from '../common/enums';
import { Station } from '../stations/station.entity';

@Entity('targets')
export class Target extends BaseEntity {
  @Column({ type: 'enum', enum: TargetScope })
  scope!: TargetScope;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId?: string | null;

  @ManyToOne(() => Station, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station?: Station | null;

  @Column({ type: 'enum', enum: TargetMetric })
  metric!: TargetMetric;

  @Column({ name: 'period_type', type: 'enum', enum: TargetPeriod })
  periodType!: TargetPeriod;

  @Column({ type: 'int' })
  year!: number;

  /** Month (1–12), ISO week (1–53), or day-of-year depending on periodType. */
  @Column({ type: 'int' })
  period!: number;

  @Column({
    name: 'target_value',
    type: 'decimal',
    precision: 14,
    scale: 2,
  })
  targetValue!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
