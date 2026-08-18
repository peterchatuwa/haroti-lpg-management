import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { TransferStatus } from '../common/enums';
import { Station } from '../stations/station.entity';
import { User } from '../users/user.entity';
import { TransferItem } from './transfer-item.entity';

@Entity('transfers')
export class Transfer extends BaseEntity {
  @Column({ name: 'transfer_number', unique: true, length: 40 })
  transferNumber!: string;

  @Column({ name: 'source_station_id' })
  sourceStationId!: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'source_station_id' })
  sourceStation!: Station;

  @Column({ name: 'destination_station_id' })
  destinationStationId!: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'destination_station_id' })
  destinationStation!: Station;

  @Column({
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.REQUESTED,
  })
  status!: TransferStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'requested_by_id', type: 'uuid', nullable: true })
  requestedById?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'requested_by_id' })
  requestedBy?: User | null;

  @Column({ name: 'approved_by_id', type: 'uuid', nullable: true })
  approvedById?: string | null;

  @Column({ name: 'dispatched_at', type: 'timestamptz', nullable: true })
  dispatchedAt?: Date;

  @Column({ name: 'received_at', type: 'timestamptz', nullable: true })
  receivedAt?: Date;

  @OneToMany(() => TransferItem, (item) => item.transfer, { cascade: true })
  items!: TransferItem[];
}
