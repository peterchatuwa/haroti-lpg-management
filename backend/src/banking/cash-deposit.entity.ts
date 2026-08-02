import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Station } from '../stations/station.entity';
import { User } from '../users/user.entity';

@Entity('cash_deposits')
export class CashDeposit extends BaseEntity {
  @Column({ name: 'station_id' })
  stationId!: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station!: Station;

  @Column({ name: 'deposit_date', type: 'date' })
  depositDate!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: string;

  @Column({ name: 'bank_name', length: 120, nullable: true })
  bankName?: string;

  @Column({ name: 'slip_number', length: 80, nullable: true })
  slipNumber?: string;

  @Column({ name: 'collection_agent', length: 120, nullable: true })
  collectionAgent?: string;

  @Column({ name: 'shift_id', type: 'uuid', nullable: true })
  shiftId?: string | null;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy?: User | null;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}