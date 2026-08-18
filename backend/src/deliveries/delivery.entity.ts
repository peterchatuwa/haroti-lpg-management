import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { DeliveryStatus } from '../common/enums';
import { Station } from '../stations/station.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { User } from '../users/user.entity';

@Entity('deliveries')
export class Delivery extends BaseEntity {
  @Column({ name: 'delivery_number', unique: true, length: 40 })
  deliveryNumber!: string;

  @Column({ name: 'supplier_id' })
  supplierId!: string;

  @ManyToOne(() => Supplier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @Column({ name: 'station_id' })
  stationId!: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station!: Station;

  @Column({ name: 'delivery_date', type: 'date' })
  deliveryDate!: string;

  @Column({ name: 'expected_arrival_at', type: 'timestamptz', nullable: true })
  expectedArrivalAt?: Date;

  @Column({ name: 'delivery_note_number', length: 80, nullable: true })
  deliveryNoteNumber?: string;

  @Column({ name: 'invoice_number', length: 80, nullable: true })
  invoiceNumber?: string;

  @Column({ name: 'truck_registration', length: 40, nullable: true })
  truckRegistration?: string;

  @Column({ name: 'driver_name', length: 120, nullable: true })
  driverName?: string;

  @Column({ name: 'source_depot', length: 160, nullable: true })
  sourceDepot?: string;

  @Column({
    name: 'quantity_ordered_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  quantityOrderedKg!: string;

  @Column({
    name: 'quantity_dispatched_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  quantityDispatchedKg!: string;

  @Column({
    name: 'quantity_received_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  quantityReceivedKg!: string;

  @Column({
    name: 'tank_level_before_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  tankLevelBeforeKg?: string;

  @Column({
    name: 'tank_level_after_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  tankLevelAfterKg?: string;

  @Column({
    name: 'buying_price_per_kg',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  buyingPricePerKg!: string;

  @Column({
    name: 'transport_cost',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  transportCost!: string;

  @Column({ type: 'text', nullable: true })
  discrepancyNotes?: string;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PURCHASE_ORDER,
  })
  status!: DeliveryStatus;

  @Column({ name: 'approved_by_id', type: 'uuid', nullable: true })
  approvedById?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy?: User | null;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById?: string | null;
}
