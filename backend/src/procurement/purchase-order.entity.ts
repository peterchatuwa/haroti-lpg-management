import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Currency, PurchaseOrderStatus } from '../common/enums';
import { Station } from '../stations/station.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { User } from '../users/user.entity';
import { PurchaseOrderLine } from './purchase-order-line.entity';

@Entity('purchase_orders')
export class PurchaseOrder extends BaseEntity {
  @Column({ name: 'po_number', unique: true, length: 40 })
  poNumber!: string;

  @Column({ name: 'supplier_id' })
  supplierId!: string;

  @ManyToOne(() => Supplier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @Column({ name: 'destination_station_id', type: 'uuid', nullable: true })
  destinationStationId?: string | null;

  @ManyToOne(() => Station, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'destination_station_id' })
  destinationStation?: Station | null;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.DRAFT,
  })
  status!: PurchaseOrderStatus;

  @Column({ type: 'enum', enum: Currency, default: Currency.MWK })
  currency!: Currency;

  @Column({
    name: 'freight_cost',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  freightCost!: string;

  @Column({
    name: 'customs_duty',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  customsDuty!: string;

  @Column({
    name: 'clearing_fees',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  clearingFees!: string;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  totalAmount!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy?: User | null;

  @Column({ name: 'approved_by_id', type: 'uuid', nullable: true })
  approvedById?: string | null;

  @OneToMany(() => PurchaseOrderLine, (line) => line.purchaseOrder, {
    cascade: true,
  })
  lines!: PurchaseOrderLine[];
}
