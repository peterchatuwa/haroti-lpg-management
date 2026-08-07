import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Delivery } from '../deliveries/delivery.entity';
import { Station } from '../stations/station.entity';

@Entity('delivery_allocations')
export class DeliveryAllocation extends BaseEntity {
  @Column({ name: 'bulk_delivery_id', type: 'uuid', nullable: true })
  bulkDeliveryId?: string | null;

  @ManyToOne(() => Delivery, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bulk_delivery_id' })
  bulkDelivery?: Delivery | null;

  @Column({ name: 'station_id' })
  stationId!: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station!: Station;

  @Column({
    name: 'allocated_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
  })
  allocatedKg!: string;

  @Column({
    name: 'delivered_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  deliveredKg!: string;

  @Column({ length: 20, default: 'PLANNED' })
  status!: 'PLANNED' | 'DISPATCHED' | 'DELIVERED' | 'VERIFIED';

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
