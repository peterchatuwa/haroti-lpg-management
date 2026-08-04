import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { CommercialStream, Currency } from '../common/enums';

@Entity('budget_lines')
export class BudgetLine extends BaseEntity {
  @Column({ length: 80 })
  category!: string;

  @Column({
    name: 'commercial_stream',
    type: 'enum',
    enum: CommercialStream,
    nullable: true,
  })
  commercialStream?: CommercialStream | null;

  @Column({ name: 'fiscal_year', type: 'int' })
  fiscalYear!: number;

  @Column({ name: 'fiscal_month', type: 'int' })
  fiscalMonth!: number;

  @Column({
    name: 'budget_amount',
    type: 'decimal',
    precision: 14,
    scale: 2,
  })
  budgetAmount!: string;

  @Column({ type: 'enum', enum: Currency, default: Currency.MWK })
  currency!: Currency;
}
