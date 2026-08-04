import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { StockOwnership } from '../common/enums';
import { Product } from '../products/product.entity';
import { Station } from '../stations/station.entity';

@Entity('accessory_stock')
@Unique(['stationId', 'productId', 'ownership'])
export class AccessoryStock extends BaseEntity {
  @Column({ name: 'station_id' })
  stationId!: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station!: Station;

  @Column({ name: 'product_id' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'int', default: 0 })
  quantity!: number;

  @Column({
    type: 'enum',
    enum: StockOwnership,
    default: StockOwnership.OWNED,
  })
  ownership!: StockOwnership;

  @Column({ name: 'batch_number', length: 60, nullable: true })
  batchNumber?: string;

  @Column({ name: 'reorder_level', type: 'int', default: 5 })
  reorderLevel!: number;
}
