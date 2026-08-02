import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { User } from '../users/user.entity';

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @Column({ length: 80 })
  action!: string;

  @Column({ name: 'entity_type', length: 80 })
  entityType!: string;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId?: string;

  @Column({ type: 'jsonb', nullable: true })
  previousValues?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  newValues?: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ name: 'ip_address', length: 60, nullable: true })
  ipAddress?: string;

  @Column({ name: 'device_info', length: 255, nullable: true })
  deviceInfo?: string;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId?: string | null;
}