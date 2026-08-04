import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { WorkOrderStatus, WorkOrderType } from '../common/enums';
import { Cylinder } from '../cylinders/cylinder.entity';
import { Station } from '../stations/station.entity';
import { User } from '../users/user.entity';

@Entity('maintenance_work_orders')
export class MaintenanceWorkOrder extends BaseEntity {
  @Column({ name: 'wo_number', unique: true, length: 40 })
  woNumber!: string;

  @Column({ type: 'enum', enum: WorkOrderType })
  type!: WorkOrderType;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.OPEN,
  })
  status!: WorkOrderStatus;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId?: string | null;

  @ManyToOne(() => Station, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'station_id' })
  station?: Station | null;

  @Column({ name: 'cylinder_id', type: 'uuid', nullable: true })
  cylinderId?: string | null;

  @ManyToOne(() => Cylinder, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cylinder_id' })
  cylinder?: Cylinder | null;

  @Column({ name: 'assigned_to_id', type: 'uuid', nullable: true })
  assignedToId?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo?: User | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;
}
