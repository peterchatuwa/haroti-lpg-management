import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
} from '../common/enums';
import { Notification } from './notification.entity';

@Entity('notification_deliveries')
export class NotificationDelivery extends BaseEntity {
  @Column({ name: 'notification_id' })
  notificationId!: string;

  @ManyToOne(() => Notification, (n) => n.deliveries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification!: Notification;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel!: NotificationChannel;

  @Column({ name: 'recipient', type: 'varchar', length: 120, nullable: true })
  recipient?: string | null;

  @Column({
    type: 'enum',
    enum: NotificationDeliveryStatus,
    default: NotificationDeliveryStatus.QUEUED,
  })
  status!: NotificationDeliveryStatus;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ name: 'provider_ref', type: 'varchar', length: 120, nullable: true })
  providerRef?: string | null;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError?: string | null;

  @Column({ name: 'next_retry_at', type: 'timestamptz', nullable: true })
  nextRetryAt?: Date | null;
}
