import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { SettlementStatus } from '../common/enums';
import { FranchiseAgreement } from './franchise-agreement.entity';
import { FranchiseSettlementLine } from './franchise-settlement-line.entity';

@Entity('franchise_settlements')
export class FranchiseSettlement extends BaseEntity {
  @Column({ name: 'settlement_number', unique: true, length: 40 })
  settlementNumber!: string;

  @Column({ name: 'agreement_id' })
  agreementId!: string;

  @ManyToOne(() => FranchiseAgreement, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'agreement_id' })
  agreement!: FranchiseAgreement;

  @Column({ name: 'period_start', type: 'date' })
  periodStart!: string;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd!: string;

  @Column({
    type: 'enum',
    enum: SettlementStatus,
    default: SettlementStatus.DRAFT,
  })
  status!: SettlementStatus;

  @Column({
    name: 'total_sales',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  totalSales!: string;

  @Column({
    name: 'royalty_due',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  royaltyDue!: string;

  @Column({
    name: 'consignment_due',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  consignmentDue!: string;

  @OneToMany(() => FranchiseSettlementLine, (l) => l.settlement, {
    cascade: true,
  })
  lines!: FranchiseSettlementLine[];
}
