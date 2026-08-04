import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { ShiftStatus } from '../common/enums';
import { Station } from '../stations/station.entity';
import { User } from '../users/user.entity';

@Entity('shifts')
export class Shift extends BaseEntity {
  @Column({ name: 'station_id' })
  stationId!: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station!: Station;

  @Column({ name: 'attendant_id' })
  attendantId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'attendant_id' })
  attendant!: User;

  @Column({ type: 'enum', enum: ShiftStatus, default: ShiftStatus.OPEN })
  status!: ShiftStatus;

  @Column({ name: 'opened_at', type: 'timestamptz' })
  openedAt!: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt?: Date;

  @Column({
    name: 'opening_cash_float',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  openingCashFloat!: string;

  @Column({
    name: 'opening_lpg_stock_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  openingLpgStockKg!: string;

  @Column({ name: 'opening_cylinder_count', type: 'int', default: 0 })
  openingCylinderCount!: number;

  @Column({
    name: 'cash_sales',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  cashSales!: string;

  @Column({
    name: 'mobile_money_sales',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  mobileMoneySales!: string;

  @Column({
    name: 'bank_sales',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  bankSales!: string;

  @Column({
    name: 'credit_sales',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  creditSales!: string;

  @Column({
    name: 'cash_expenses',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  cashExpenses!: string;

  @Column({
    name: 'cash_deposited',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  cashDeposited!: string;

  @Column({
    name: 'expected_cash',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  expectedCash!: string;

  @Column({
    name: 'cash_counted',
    type: 'decimal',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  cashCounted?: string;

  @Column({
    name: 'cash_variance',
    type: 'decimal',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  cashVariance?: string;

  @Column({
    name: 'lpg_sold_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  lpgSoldKg!: string;

  @Column({
    name: 'expected_lpg_stock_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  expectedLpgStockKg?: string;

  @Column({
    name: 'physical_lpg_stock_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  physicalLpgStockKg?: string;

  @Column({
    name: 'stock_variance_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  stockVarianceKg?: string;

  @Column({ name: 'closing_cylinder_count', type: 'int', nullable: true })
  closingCylinderCount?: number;

  @Column({ type: 'text', nullable: true })
  varianceNotes?: string;

  @Column({ name: 'approved_by_id', type: 'uuid', nullable: true })
  approvedById?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy?: User | null;

  @Column({ name: 'locked_at', type: 'timestamptz', nullable: true })
  lockedAt?: Date | null;
}