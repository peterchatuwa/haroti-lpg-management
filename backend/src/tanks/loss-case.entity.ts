import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { LossCaseCategory, LossCaseStatus } from '../common/enums';
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

  @Column({ type: 'enum', enum: LossCaseCategory, nullable: true })
  category?: LossCaseCategory;

  @Column({ name: 'investigator_id', type: 'uuid', nullable: true })
  investigatorId?: string;

  @Column({
    name: 'wac_value_mwk',
    type: 'decimal',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  wacValueMwk?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'root_cause', type: 'text', nullable: true })
  rootCause?: string;

  @Column({ name: 'corrective_action', type: 'text', nullable: true })
  correctiveAction?: string;
}
