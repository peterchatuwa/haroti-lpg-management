import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { ComplianceItemStatus, ComplianceItemType } from '../common/enums';
import { Station } from '../stations/station.entity';

@Entity('compliance_items')
export class ComplianceItem extends BaseEntity {
  @Column({ length: 160 })
  title!: string;

  @Column({ type: 'enum', enum: ComplianceItemType })
  type!: ComplianceItemType;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId?: string | null;

  @ManyToOne(() => Station, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station?: Station | null;

  @Column({ name: 'issue_date', type: 'date', nullable: true })
  issueDate?: string;

  @Column({ name: 'expiry_date', type: 'date' })
  expiryDate!: string;

  @Column({
    type: 'enum',
    enum: ComplianceItemStatus,
    default: ComplianceItemStatus.VALID,
  })
  status!: ComplianceItemStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'document_ref', length: 120, nullable: true })
  documentRef?: string;
}
