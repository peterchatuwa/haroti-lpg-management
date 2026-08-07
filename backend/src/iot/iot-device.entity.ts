import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { IoTDeviceStatus, IoTDeviceType } from '../common/enums';
import { Station } from '../stations/station.entity';
import { Tank } from '../tanks/tank.entity';

@Entity('iot_devices')
export class IoTDevice extends BaseEntity {
  @Column({ name: 'device_key', type: 'varchar', length: 80, unique: true })
  deviceKey!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'enum', enum: IoTDeviceType })
  type!: IoTDeviceType;

  @Column({
    type: 'enum',
    enum: IoTDeviceStatus,
    default: IoTDeviceStatus.ACTIVE,
  })
  status!: IoTDeviceStatus;

  @Column({ name: 'station_id', type: 'uuid' })
  stationId!: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station!: Station;

  @Column({ name: 'tank_id', type: 'uuid', nullable: true })
  tankId?: string | null;

  @ManyToOne(() => Tank, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tank_id' })
  tank?: Tank | null;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt?: Date | null;
}
