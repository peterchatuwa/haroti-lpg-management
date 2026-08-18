import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { StockMovementType } from '../common/enums';
import { Station } from '../stations/station.entity';
import { User } from '../users/user.entity';

@Entity('stock_movements')
export class StockMovement extends BaseEntity {
  @Column({ name: 'station_id' })
  stationId!: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station!: Station;

  @Column({ type: 'enum', enum: StockMovementType })
  type!: StockMovementType;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantityKg!: string;

  @Column({
    name: 'stock_before_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
  })
  stockBeforeKg!: string;

  @Column({
    name: 'stock_after_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
  })
  stockAfterKg!: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ name: 'reference_type', length: 60, nullable: true })
  referenceType?: string;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId?: string;

  @Column({ name: 'requires_approval', default: false })
  requiresApproval!: boolean;

  @Column({ name: 'approved_by_id', type: 'uuid', nullable: true })
  approvedById?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy?: User | null;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy?: User | null;

  @Column({ name: 'client_txn_id', length: 80, nullable: true, unique: true })
  clientTxnId?: string;
}
