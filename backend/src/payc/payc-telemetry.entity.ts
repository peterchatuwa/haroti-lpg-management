import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { PaycMeter } from './payc-meter.entity';

@Entity('payc_telemetry')
export class PaycTelemetry extends BaseEntity {
  @Column({ name: 'meter_id' })
  meterId!: string;

  @ManyToOne(() => PaycMeter, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meter_id' })
  meter!: PaycMeter;

  @Column({
    name: 'burn_kg',
    type: 'decimal',
    precision: 8,
    scale: 3,
    default: 0,
  })
  burnKg!: string;

  @Column({
    name: 'credit_remaining_kg',
    type: 'decimal',
    precision: 10,
    scale: 3,
    default: 0,
  })
  creditRemainingKg!: string;

  @Column({ name: 'valve_open', default: true })
  valveOpen!: boolean;

  @Column({ name: 'recorded_at', type: 'timestamptz', default: () => 'NOW()' })
  recordedAt!: Date;
}
