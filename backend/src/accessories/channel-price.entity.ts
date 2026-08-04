import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Currency, SalesChannel } from '../common/enums';
import { Product } from '../products/product.entity';

@Entity('channel_prices')
@Unique(['productId', 'channel'])
export class ChannelPrice extends BaseEntity {
  @Column({ name: 'product_id' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'enum', enum: SalesChannel })
  channel!: SalesChannel;

  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  unitPrice!: string;

  @Column({
    name: 'commission_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  commissionPercent!: string;

  @Column({ type: 'enum', enum: Currency, default: Currency.MWK })
  currency!: Currency;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
