import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { CapitalProject } from './capital-project.entity';

@Entity('project_milestones')
export class ProjectMilestone extends BaseEntity {
  @Column({ name: 'project_id' })
  projectId!: string;

  @ManyToOne(() => CapitalProject, (p) => p.milestones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: CapitalProject;

  @Column({ length: 160 })
  name!: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string;

  @Column({ name: 'is_completed', default: false })
  isCompleted!: boolean;

  @Column({
    name: 'budget_allocation',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  budgetAllocation!: string;
}
