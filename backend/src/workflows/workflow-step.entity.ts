import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { UserRole } from '../common/enums';
import { WorkflowDefinition } from './workflow-definition.entity';

@Entity('workflow_steps')
export class WorkflowStep extends BaseEntity {
  @Column({ name: 'definition_id' })
  definitionId!: string;

  @ManyToOne(() => WorkflowDefinition, (d) => d.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'definition_id' })
  definition!: WorkflowDefinition;

  @Column({ name: 'step_order', type: 'int' })
  stepOrder!: number;

  @Column({ name: 'approver_role', type: 'varchar', length: 40 })
  approverRole!: UserRole;

  @Column({ name: 'escalation_hours', type: 'int', default: 24 })
  escalationHours!: number;

  @Column({
    name: 'fallback_role',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  fallbackRole?: UserRole | null;
}
