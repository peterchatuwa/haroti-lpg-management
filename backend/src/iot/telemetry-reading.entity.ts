import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { IoTDevice } from './iot-device.entity';

@Entity('telemetry_readings')
export class TelemetryReading extends BaseEntity {
  @Column({ name: 'device_id' })
  deviceId!: string;

  @ManyToOne(() => IoTDevice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device!: IoTDevice;

  @Column({ name: 'raw_payload', type: 'jsonb', nullable: true })
  rawPayload?: Record<string, unknown> | null;

  @Column({
    name: 'level_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  levelKg?: string | null;

  @Column({
    name: 'pressure_bar',
    type: 'decimal',
    precision: 8,
    scale: 3,
    nullable: true,
  })
  pressureBar?: string | null;

  @Column({
    name: 'temperature_c',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
  })
  temperatureC?: string | null;

  @Column({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt!: Date;
}
