import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import {
  CommercialStream,
  Currency,
  ProjectStatus,
  ProjectType,
} from '../common/enums';
import { Station } from '../stations/station.entity';
import { ProjectExpenditure } from './project-expenditure.entity';
import { ProjectMilestone } from './project-milestone.entity';

@Entity('capital_projects')
export class CapitalProject extends BaseEntity {
  @Column({ name: 'project_code', unique: true, length: 40 })
  projectCode!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ type: 'enum', enum: ProjectType })
  type!: ProjectType;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING,
  })
  status!: ProjectStatus;

  @Column({
    name: 'commercial_stream',
    type: 'enum',
    enum: CommercialStream,
    nullable: true,
  })
  commercialStream?: CommercialStream | null;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId?: string | null;

  @ManyToOne(() => Station, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'station_id' })
  station?: Station | null;

  @Column({
    name: 'approved_budget',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  approvedBudget!: string;

  @Column({
    name: 'spent_to_date',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  spentToDate!: string;

  @Column({ name: 'grant_reference', length: 80, nullable: true })
  grantReference?: string;

  @Column({ type: 'enum', enum: Currency, default: Currency.MWK })
  currency!: Currency;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: string;

  @Column({ name: 'target_end_date', type: 'date', nullable: true })
  targetEndDate?: string;

  @OneToMany(() => ProjectMilestone, (m) => m.project, { cascade: true })
  milestones!: ProjectMilestone[];

  @OneToMany(() => ProjectExpenditure, (e) => e.project, { cascade: true })
  expenditures!: ProjectExpenditure[];
}
