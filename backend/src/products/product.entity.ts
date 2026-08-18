import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { ProductCategory } from '../common/enums';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ unique: true, length: 40 })
  sku!: string;

  @Column({ length: 160 })
  name!: string;

  @Column({ type: 'enum', enum: ProductCategory })
  category!: ProductCategory;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  unitPrice!: string;

  @Column({
    name: 'price_per_kg',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  pricePerKg?: string;

  @Column({
    name: 'nominal_kg',
    type: 'decimal',
    precision: 8,
    scale: 3,
    nullable: true,
  })
  nominalKg?: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ length: 60, nullable: true })
  barcode?: string;

  @Column({
    name: 'cost_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  costPrice!: string;

  @Column({ name: 'serial_tracked', default: false })
  serialTracked!: boolean;

  @Column({ name: 'batch_tracked', default: false })
  batchTracked!: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
