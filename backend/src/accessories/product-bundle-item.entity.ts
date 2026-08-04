import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Product } from '../products/product.entity';
import { ProductBundle } from './product-bundle.entity';

@Entity('product_bundle_items')
export class ProductBundleItem extends BaseEntity {
  @Column({ name: 'bundle_id' })
  bundleId!: string;

  @ManyToOne(() => ProductBundle, (b) => b.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bundle_id' })
  bundle!: ProductBundle;

  @Column({ name: 'product_id' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'int', default: 1 })
  quantity!: number;
}
