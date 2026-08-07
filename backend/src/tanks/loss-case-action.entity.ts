import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { LossCase } from './loss-case.entity';

@Entity('loss_case_actions')
export class LossCaseAction extends BaseEntity {
  @Column({ name: 'loss_case_id' })
  lossCaseId!: string;

  @ManyToOne(() => LossCase, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loss_case_id' })
  lossCase!: LossCase;

  @Column({ length: 200 })
  description!: string;

  @Column({ name: 'assigned_to_id', type: 'uuid', nullable: true })
  assignedToId?: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string;

  @Column({ default: false })
  completed!: boolean;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;
}
