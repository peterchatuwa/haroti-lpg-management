import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Product } from '../products/product.entity';
import { ProductBundleItem } from './product-bundle-item.entity';

@Entity('product_bundles')
export class ProductBundle extends BaseEntity {
  @Column({ unique: true, length: 40 })
  sku!: string;

  @Column({ length: 160 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    name: 'bundle_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  bundlePrice!: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId?: string | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product?: Product | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => ProductBundleItem, (item) => item.bundle, { cascade: true })
  items!: ProductBundleItem[];
}
