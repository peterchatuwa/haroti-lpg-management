import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Station } from '../stations/station.entity';

@Entity('tanks')
export class Tank extends BaseEntity {
  @Column({ name: 'tank_code', length: 40 })
  tankCode!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ name: 'station_id' })
  stationId!: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station!: Station;

  @Column({
    name: 'capacity_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  capacityKg!: string;

  @Column({
    name: 'safe_working_capacity_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  safeWorkingCapacityKg!: string;

  @Column({
    name: 'current_stock_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  currentStockKg!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
