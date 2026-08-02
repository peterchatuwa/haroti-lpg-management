import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

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
}