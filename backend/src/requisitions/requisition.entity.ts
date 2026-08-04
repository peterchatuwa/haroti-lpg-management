import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { RequisitionStatus } from '../common/enums';
import { Station } from '../stations/station.entity';
import { User } from '../users/user.entity';
import { RequisitionLine } from './requisition-line.entity';

@Entity('requisitions')
export class Requisition extends BaseEntity {
  @Column({ name: 'requisition_number', unique: true, length: 40 })
  requisitionNumber!: string;

  @Column({ name: 'station_id' })
  stationId!: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station!: Station;

  @Column({ name: 'requested_by_id' })
  requestedById!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requested_by_id' })
  requestedBy!: User;

  @Column({ type: 'enum', enum: RequisitionStatus, default: RequisitionStatus.SUBMITTED })
  status!: RequisitionStatus;

  @Column({ length: 80 })
  category!: string;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  totalAmount!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'gm_approved_by_id', type: 'uuid', nullable: true })
  gmApprovedById?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'gm_approved_by_id' })
  gmApprovedBy?: User | null;

  @Column({ name: 'gm_approved_at', type: 'timestamptz', nullable: true })
  gmApprovedAt?: Date | null;

  @Column({ name: 'paid_by_id', type: 'uuid', nullable: true })
  paidById?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'paid_by_id' })
  paidBy?: User | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date | null;

  @Column({ name: 'payment_reference', length: 80, nullable: true })
  paymentReference?: string | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string | null;

  @OneToMany(() => RequisitionLine, (line) => line.requisition, {
    cascade: true,
  })
  lines!: RequisitionLine[];
}
