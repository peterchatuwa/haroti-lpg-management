import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Currency } from '../common/enums';

@Entity('bank_accounts')
export class BankAccount extends BaseEntity {
  @Column({ name: 'account_name', length: 120 })
  accountName!: string;

  @Column({ name: 'bank_name', length: 80 })
  bankName!: string;

  @Column({ name: 'account_mask', length: 20 })
  accountMask!: string;

  @Column({ name: 'gl_account_code', length: 10 })
  glAccountCode!: string;

  @Column({ type: 'enum', enum: Currency, default: Currency.MWK })
  currency!: Currency;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
