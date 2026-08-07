import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import {
  ApprovalTaskStatus,
  UserRole,
  WorkflowEntityType,
} from '../common/enums';
import { Station } from '../stations/station.entity';
import { User } from '../users/user.entity';

@Entity('approval_tasks')
export class ApprovalTask extends BaseEntity {
  @Column({ name: 'task_number', length: 40, unique: true })
  taskNumber!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 40 })
  entityType!: WorkflowEntityType;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  amount!: string;

  @Column({
    type: 'enum',
    enum: ApprovalTaskStatus,
    default: ApprovalTaskStatus.PENDING,
  })
  status!: ApprovalTaskStatus;

  @Column({ name: 'current_step', type: 'int', default: 1 })
  currentStep!: number;

  @Column({ name: 'assigned_role', type: 'varchar', length: 40 })
  assignedRole!: UserRole;

  @Column({ name: 'due_at', type: 'timestamptz' })
  dueAt!: Date;

  @Column({ name: 'requester_id' })
  requesterId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requester_id' })
  requester!: User;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId?: string | null;

  @ManyToOne(() => Station, { nullable: true })
  @JoinColumn({ name: 'station_id' })
  station?: Station | null;

  @Column({ type: 'text', nullable: true })
  summary?: string | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date | null;

  @Column({ name: 'resolved_by_id', type: 'uuid', nullable: true })
  resolvedById?: string | null;
}
