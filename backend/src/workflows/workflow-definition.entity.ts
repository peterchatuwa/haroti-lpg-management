import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { WorkflowEntityType } from '../common/enums';
import { WorkflowStep } from './workflow-step.entity';

@Entity('workflow_definitions')
export class WorkflowDefinition extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 40 })
  entityType!: WorkflowEntityType;

  @Column({
    name: 'min_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  minAmount!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => WorkflowStep, (s) => s.definition)
  steps!: WorkflowStep[];
}
