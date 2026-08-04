import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Product } from '../products/product.entity';
import { PurchaseOrder } from './purchase-order.entity';

@Entity('purchase_order_lines')
export class PurchaseOrderLine extends BaseEntity {
  @Column({ name: 'purchase_order_id' })
  purchaseOrderId!: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder!: PurchaseOrder;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId?: string | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product?: Product | null;

  @Column({ name: 'item_description', length: 200 })
  itemDescription!: string;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({
    name: 'unit_cost',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  unitCost!: string;

  @Column({
    name: 'landed_unit_cost',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  landedUnitCost!: string;

  @Column({
    name: 'line_total',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  lineTotal!: string;

  @Column({ name: 'quantity_received', type: 'int', default: 0 })
  quantityReceived!: number;
}
