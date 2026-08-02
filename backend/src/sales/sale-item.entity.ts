import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Product } from '../products/product.entity';
import { Sale } from './sale.entity';

@Entity('sale_items')
export class SaleItem extends BaseEntity {
  @Column({ name: 'sale_id' })
  saleId!: string;

  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale!: Sale;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId?: string | null;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product | null;

  @Column({ name: 'item_name', length: 160 })
  itemName!: string;

  @Column({
    name: 'cylinder_size_kg',
    type: 'decimal',
    precision: 8,
    scale: 3,
    nullable: true,
  })
  cylinderSizeKg?: string;

  @Column({ name: 'cylinder_serial', length: 80, nullable: true })
  cylinderSerial?: string;

  @Column({
    name: 'empty_weight_kg',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  emptyWeightKg?: string;

  @Column({
    name: 'filled_weight_kg',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  filledWeightKg?: string;

  @Column({
    name: 'lpg_quantity_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  lpgQuantityKg!: string;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  unitPrice!: string;

  @Column({
    name: 'line_total',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  lineTotal!: string;

  @Column({ type: 'int', default: 1 })
  quantity!: number;
}