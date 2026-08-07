import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Customer } from '../customers/customer.entity';

@Entity('suppliers')
export class Supplier extends BaseEntity {
  @Column({ unique: true, length: 40 })
  code!: string;

  @Column({ length: 160 })
  name!: string;

  @Column({ length: 40, nullable: true })
  phone?: string;

  @Column({ length: 160, nullable: true })
  email?: string;

  @Column({ name: 'depot_name', length: 160, nullable: true })
  depotName?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  /** Optional link to an existing customer record. */
  @Column({ name: 'customer_id', type: 'uuid', nullable: true, unique: true })
  customerId?: string | null;

  @Column({ name: 'legal_name', length: 160, nullable: true })
  legalName?: string;

  @Column({ name: 'trading_name', length: 160, nullable: true })
  tradingName?: string;

  @Column({ name: 'tax_id', length: 40, nullable: true })
  taxId?: string;

  @Column({ name: 'payment_terms_days', type: 'int', default: 30 })
  paymentTermsDays!: number;

  @Column({ name: 'bank_account_mask', length: 30, nullable: true })
  bankAccountMask?: string;

  @Column({ name: 'is_approved_vendor', default: false })
  isApprovedVendor!: boolean;

  @Column({ length: 80, nullable: true })
  category?: string;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;
}
