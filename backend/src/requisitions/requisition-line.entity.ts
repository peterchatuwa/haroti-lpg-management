import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Requisition } from './requisition.entity';

@Entity('requisition_lines')
export class RequisitionLine extends BaseEntity {
  @Column({ name: 'requisition_id' })
  requisitionId!: string;

  @ManyToOne(() => Requisition, (r) => r.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requisition_id' })
  requisition!: Requisition;

  @Column({ name: 'item_description', length: 200 })
  itemDescription!: string;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({
    name: 'unit_cost',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  unitCost!: string;

  @Column({
    name: 'line_total',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  lineTotal!: string;
}
