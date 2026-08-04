import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Station } from '../stations/station.entity';

@Entity('franchise_agreements')
export class FranchiseAgreement extends BaseEntity {
  @Column({ name: 'agreement_code', unique: true, length: 40 })
  agreementCode!: string;

  @Column({ name: 'franchise_name', length: 160 })
  franchiseName!: string;

  @Column({ name: 'station_id' })
  stationId!: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station!: Station;

  @Column({
    name: 'royalty_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 5,
  })
  royaltyPercent!: string;

  @Column({
    name: 'agent_commission_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 8,
  })
  agentCommissionPercent!: string;

  @Column({ name: 'consignment_enabled', default: true })
  consignmentEnabled!: boolean;

  @Column({ name: 'contact_phone', length: 40, nullable: true })
  contactPhone?: string;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
