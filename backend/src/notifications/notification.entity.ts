import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { NotificationStatus } from '../common/enums';
import { User } from '../users/user.entity';
import { NotificationDelivery } from './notification-delivery.entity';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @Column({ name: 'event_type', type: 'varchar', length: 60 })
  eventType!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status!: NotificationStatus;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date | null;

  @Column({ name: 'entity_type', type: 'varchar', length: 40, nullable: true })
  relatedEntityType?: string | null;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  relatedEntityId?: string | null;

  @OneToMany(() => NotificationDelivery, (d) => d.notification)
  deliveries!: NotificationDelivery[];
}
