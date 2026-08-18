import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { UserRole } from '../common/enums';
import { Station } from '../stations/station.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true, length: 80 })
  username!: string;

  @Column({ name: 'full_name', length: 160 })
  fullName!: string;

  @Column({ length: 160, nullable: true })
  email?: string;

  @Column({ length: 40, nullable: true })
  phone?: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId?: string | null;

  @ManyToOne(() => Station, (station) => station.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'station_id' })
  station?: Station | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'can_override_price', default: false })
  canOverridePrice!: boolean;

  @Column({
    name: 'discount_limit_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  discountLimitPercent!: string;

  @Column({
    name: 'invite_token_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  inviteTokenHash?: string | null;

  @Column({ name: 'invite_expires_at', type: 'timestamptz', nullable: true })
  inviteExpiresAt?: Date | null;

  @Column({ name: 'must_set_password', default: false })
  mustSetPassword!: boolean;
}
