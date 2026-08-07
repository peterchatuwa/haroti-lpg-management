import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import {
  CommercialStream,
  StationStatus,
  WarehouseType,
} from '../common/enums';
import { User } from '../users/user.entity';

@Entity('stations')
export class Station extends BaseEntity {
  @Column({ unique: true, length: 20 })
  code!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ length: 80 })
  district!: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ name: 'manager_name', length: 120, nullable: true })
  managerName?: string;

  @Column({
    name: 'tank_capacity_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  tankCapacityKg!: string;

  @Column({
    name: 'current_stock_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  currentStockKg!: string;

  @Column({
    type: 'enum',
    enum: StationStatus,
    default: StationStatus.ACTIVE,
  })
  status!: StationStatus;

  @Column({ name: 'opening_time', type: 'time', nullable: true })
  openingTime?: string;

  @Column({ name: 'closing_time', type: 'time', nullable: true })
  closingTime?: string;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt?: Date;

  @Column({
    name: 'commercial_stream',
    type: 'enum',
    enum: CommercialStream,
    default: CommercialStream.RETAIL_FORECOURT,
  })
  commercialStream!: CommercialStream;

  @Column({
    name: 'warehouse_type',
    type: 'enum',
    enum: WarehouseType,
    default: WarehouseType.OWNED_STATION,
  })
  warehouseType!: WarehouseType;

  @Column({ name: 'is_franchise', default: false })
  isFranchise!: boolean;

  @Column({
    name: 'weighted_avg_cost_per_kg',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 1200,
  })
  weightedAvgCostPerKg!: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude?: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude?: string;

  @Column({
    name: 'min_stock_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  minStockKg?: string;

  @Column({
    name: 'reorder_level_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  reorderLevelKg?: string;

  @Column({
    name: 'safety_stock_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  safetyStockKg?: string;

  @OneToMany(() => User, (user) => user.station)
  users!: User[];
}