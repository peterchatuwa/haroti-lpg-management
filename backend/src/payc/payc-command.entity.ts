import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { User } from '../users/user.entity';
import { PaycMeter } from './payc-meter.entity';

@Entity('payc_commands')
export class PaycCommand extends BaseEntity {
  @Column({ name: 'meter_id' })
  meterId!: string;

  @ManyToOne(() => PaycMeter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meter_id' })
  meter!: PaycMeter;

  @Column({ name: 'command_type', length: 40 })
  commandType!: string;

  @Column({ name: 'vendor_value_id', length: 40, nullable: true })
  vendorValueId?: string;

  @Column({ length: 20, default: 'PENDING' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ name: 'requested_by_user_id', type: 'uuid', nullable: true })
  requestedByUserId?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requested_by_user_id' })
  requestedBy?: User | null;
}
