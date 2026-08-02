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
}