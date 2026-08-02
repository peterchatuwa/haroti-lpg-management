import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { CustomerType } from '../common/enums';
import { Station } from '../stations/station.entity';

@Entity('customers')
export class Customer extends BaseEntity {
  @Column({ name: 'customer_code', unique: true, length: 40 })
  customerCode!: string;

  @Column({ name: 'full_name', length: 160 })
  fullName!: string;

  @Column({ length: 40, nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  location?: string;

  @Column({
    type: 'enum',
    enum: CustomerType,
    default: CustomerType.HOUSEHOLD,
  })
  type!: CustomerType;

  @Column({ name: 'tax_number', length: 60, nullable: true })
  taxNumber?: string;

  @Column({
    name: 'credit_limit',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  creditLimit!: string;

  @Column({
    name: 'outstanding_balance',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  outstandingBalance!: string;

  @Column({ name: 'payment_terms_days', type: 'int', default: 0 })
  paymentTermsDays!: number;

  @Column({
    name: 'contract_price_per_kg',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  contractPricePerKg?: string;

  @Column({ name: 'is_suspended', default: false })
  isSuspended!: boolean;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId?: string | null;

  @ManyToOne(() => Station, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'station_id' })
  station?: Station | null;
}