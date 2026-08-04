import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { FranchiseSettlement } from './franchise-settlement.entity';

@Entity('franchise_settlement_lines')
export class FranchiseSettlementLine extends BaseEntity {
  @Column({ name: 'settlement_id' })
  settlementId!: string;

  @ManyToOne(() => FranchiseSettlement, (s) => s.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'settlement_id' })
  settlement!: FranchiseSettlement;

  @Column({ length: 200 })
  description!: string;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({
    name: 'unit_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  unitAmount!: string;

  @Column({
    name: 'line_total',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  lineTotal!: string;
}
