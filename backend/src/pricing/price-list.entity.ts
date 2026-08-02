import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Station } from '../stations/station.entity';

@Entity('price_lists')
export class PriceList extends BaseEntity {
  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId?: string | null;

  @ManyToOne(() => Station, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station?: Station | null;

  @Column({
    name: 'price_per_kg',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  pricePerKg!: string;

  @Column({ name: 'effective_from', type: 'timestamptz' })
  effectiveFrom!: Date;

  @Column({ name: 'effective_to', type: 'timestamptz', nullable: true })
  effectiveTo?: Date | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}