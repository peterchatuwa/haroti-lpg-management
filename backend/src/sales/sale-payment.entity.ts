import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { PaymentMethod } from '../common/enums';
import { Sale } from './sale.entity';

@Entity('sale_payments')
export class SalePayment extends BaseEntity {
  @Column({ name: 'sale_id' })
  saleId!: string;

  @ManyToOne(() => Sale, (sale) => sale.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale!: Sale;

  @Column({ type: 'enum', enum: PaymentMethod })
  method!: PaymentMethod;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: string;

  @Column({ name: 'reference', length: 120, nullable: true })
  reference?: string;
}
