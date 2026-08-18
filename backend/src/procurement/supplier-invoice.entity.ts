import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { SupplierInvoiceStatus, ThreeWayMatchStatus } from '../common/enums';
import { PurchaseOrder } from './purchase-order.entity';
import { Supplier } from '../suppliers/supplier.entity';

@Entity('supplier_invoices')
export class SupplierInvoice extends BaseEntity {
  @Column({ name: 'invoice_number', length: 60 })
  invoiceNumber!: string;

  @Column({ name: 'supplier_id' })
  supplierId!: string;

  @ManyToOne(() => Supplier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @Column({ name: 'purchase_order_id', type: 'uuid', nullable: true })
  purchaseOrderId?: string | null;

  @ManyToOne(() => PurchaseOrder, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder?: PurchaseOrder | null;

  @Column({ name: 'invoice_date', type: 'date' })
  invoiceDate!: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: string;

  @Column({
    name: 'tax_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  taxAmount!: string;

  @Column({
    type: 'enum',
    enum: SupplierInvoiceStatus,
    default: SupplierInvoiceStatus.REGISTERED,
  })
  status!: SupplierInvoiceStatus;

  @Column({
    name: 'match_status',
    type: 'enum',
    enum: ThreeWayMatchStatus,
    default: ThreeWayMatchStatus.PENDING,
  })
  matchStatus!: ThreeWayMatchStatus;

  @Column({
    name: 'variance_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  varianceAmount?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
