import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { CylinderOwnership, CylinderStatus } from '../common/enums';
import { Customer } from '../customers/customer.entity';
import { Station } from '../stations/station.entity';

@Entity('cylinders')
export class Cylinder extends BaseEntity {
  @Column({ name: 'serial_number', unique: true, length: 80 })
  serialNumber!: string;

  @Column({ name: 'barcode', length: 80, nullable: true })
  barcode?: string;

  @Column({
    name: 'size_kg',
    type: 'decimal',
    precision: 8,
    scale: 3,
  })
  sizeKg!: string;

  @Column({ length: 120, nullable: true })
  manufacturer?: string;

  @Column({ name: 'manufacturing_date', type: 'date', nullable: true })
  manufacturingDate?: string;

  @Column({ name: 'last_inspection_date', type: 'date', nullable: true })
  lastInspectionDate?: string;

  @Column({ name: 'next_inspection_date', type: 'date', nullable: true })
  nextInspectionDate?: string;

  @Column({
    type: 'enum',
    enum: CylinderOwnership,
    default: CylinderOwnership.COMPANY,
  })
  ownership!: CylinderOwnership;

  @Column({
    type: 'enum',
    enum: CylinderStatus,
    default: CylinderStatus.AVAILABLE,
  })
  status!: CylinderStatus;

  @Column({
    name: 'deposit_value',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  depositValue!: string;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId?: string | null;

  @ManyToOne(() => Station, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'station_id' })
  station?: Station | null;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId?: string | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}