import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { CommissionStatus } from '../common/enums';
import { Customer } from '../customers/customer.entity';
import { Sale } from '../sales/sale.entity';

@Entity('agent_commissions')
export class AgentCommission extends BaseEntity {
  @Column({ name: 'agent_id' })
  agentId!: string;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'agent_id' })
  agent!: Customer;

  @Column({ name: 'sale_id', type: 'uuid', nullable: true })
  saleId?: string | null;

  @ManyToOne(() => Sale, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sale_id' })
  sale?: Sale | null;

  @Column({
    name: 'sale_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  saleAmount!: string;

  @Column({
    name: 'commission_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 8,
  })
  commissionPercent!: string;

  @Column({
    name: 'commission_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  commissionAmount!: string;

  @Column({
    type: 'enum',
    enum: CommissionStatus,
    default: CommissionStatus.ACCRUED,
  })
  status!: CommissionStatus;
}
