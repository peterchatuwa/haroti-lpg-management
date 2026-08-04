import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { LossCaseStatus } from '../common/enums';
import { Station } from '../stations/station.entity';
import { Tank } from './tank.entity';

@Entity('loss_cases')
export class LossCase extends BaseEntity {
  @Column({ name: 'case_number', unique: true, length: 40 })
  caseNumber!: string;

  @Column({ name: 'station_id' })
  stationId!: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station!: Station;

  @Column({ name: 'tank_id', type: 'uuid', nullable: true })
  tankId?: string | null;

  @ManyToOne(() => Tank, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tank_id' })
  tank?: Tank | null;

  @Column({ name: 'period_start', type: 'date' })
  periodStart!: string;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd!: string;

  @Column({
    name: 'expected_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  expectedKg!: string;

  @Column({
    name: 'physical_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  physicalKg!: string;

  @Column({
    name: 'variance_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  varianceKg!: string;

  @Column({
    name: 'variance_percent',
    type: 'decimal',
    precision: 8,
    scale: 3,
    default: 0,
  })
  variancePercent!: string;

  @Column({
    name: 'threshold_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 2,
  })
  thresholdPercent!: string;

  @Column({ type: 'enum', enum: LossCaseStatus, default: LossCaseStatus.OPEN })
  status!: LossCaseStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
