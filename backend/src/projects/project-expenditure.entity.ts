import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { CapitalProject } from './capital-project.entity';

@Entity('project_expenditures')
export class ProjectExpenditure extends BaseEntity {
  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => CapitalProject, (p) => p.expenditures, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: CapitalProject;

  @Column({ length: 200 })
  description!: string;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
  })
  amount!: string;

  @Column({ name: 'expense_date', type: 'date' })
  expenseDate!: string;

  @Column({ name: 'vendor_name', length: 160, nullable: true })
  vendorName?: string;

  @Column({ name: 'is_cwip', default: true })
  isCwip!: boolean;
}
