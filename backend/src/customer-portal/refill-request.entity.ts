import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { RefillRequestStatus } from '../common/enums';
import { Customer } from '../customers/customer.entity';
import { Station } from '../stations/station.entity';

@Entity('refill_requests')
export class RefillRequest extends BaseEntity {
  @Column({ name: 'request_number', type: 'varchar', length: 40, unique: true })
  requestNumber!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId?: string | null;

  @ManyToOne(() => Station, { nullable: true })
  @JoinColumn({ name: 'station_id' })
  station?: Station | null;

  @Column({
    name: 'quantity_kg',
    type: 'decimal',
    precision: 10,
    scale: 3,
    default: 0,
  })
  quantityKg!: string;

  @Column({
    type: 'enum',
    enum: RefillRequestStatus,
    default: RefillRequestStatus.PENDING,
  })
  status!: RefillRequestStatus;

  @Column({ name: 'preferred_date', type: 'date', nullable: true })
  preferredDate?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;
}
