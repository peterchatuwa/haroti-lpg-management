import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { NotificationChannel } from '../common/enums';
import { User } from '../users/user.entity';

@Entity('notification_preferences')
@Unique(['userId', 'eventType', 'channel'])
export class NotificationPreference extends BaseEntity {
  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'event_type', type: 'varchar', length: 60 })
  eventType!: string;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel!: NotificationChannel;

  @Column({ default: true })
  enabled!: boolean;

  @Column({ name: 'is_mandatory', default: false })
  isMandatory!: boolean;
}
