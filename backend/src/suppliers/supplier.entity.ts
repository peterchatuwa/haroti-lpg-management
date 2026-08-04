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

  /** Vendors must be linked to an existing customer record. */
  @Column({ name: 'customer_id', type: 'uuid', nullable: true, unique: true })
  customerId?: string | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;
}
