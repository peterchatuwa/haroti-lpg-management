import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { AssetCategory } from '../common/enums';
import { Asset } from '../maintenance/asset.entity';
import { Station } from '../stations/station.entity';

@Entity('maintenance_plans')
export class MaintenancePlan extends BaseEntity {
  @Column({ length: 120 })
  name!: string;

  @Column({ name: 'asset_category', type: 'enum', enum: AssetCategory })
  assetCategory!: AssetCategory;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId?: string | null;

  @ManyToOne(() => Station, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station?: Station | null;

  @Column({ name: 'asset_id', type: 'uuid', nullable: true })
  assetId?: string | null;

  @ManyToOne(() => Asset, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'asset_id' })
  asset?: Asset | null;

  @Column({ name: 'interval_days', type: 'int' })
  intervalDays!: number;

  @Column({ name: 'next_due_date', type: 'date' })
  nextDueDate!: string;

  @Column({ name: 'last_run_date', type: 'date', nullable: true })
  lastRunDate?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
