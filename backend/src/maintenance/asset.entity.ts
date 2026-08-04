import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { AssetCategory, AssetStatus } from '../common/enums';
import { Station } from '../stations/station.entity';

@Entity('assets')
export class Asset extends BaseEntity {
  @Column({ name: 'asset_code', unique: true, length: 40 })
  assetCode!: string;

  @Column({ length: 160 })
  name!: string;

  @Column({ type: 'enum', enum: AssetCategory })
  category!: AssetCategory;

  @Column({ type: 'enum', enum: AssetStatus, default: AssetStatus.ACTIVE })
  status!: AssetStatus;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId?: string | null;

  @ManyToOne(() => Station, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'station_id' })
  station?: Station | null;

  @Column({ name: 'serial_number', length: 80, nullable: true })
  serialNumber?: string;

  @Column({
    name: 'acquisition_cost',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  acquisitionCost!: string;

  @Column({ name: 'commissioned_at', type: 'date', nullable: true })
  commissionedAt?: string;

  @Column({ name: 'next_service_date', type: 'date', nullable: true })
  nextServiceDate?: string;
}
