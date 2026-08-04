import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { PaymentMethod, SettlementMatchStatus } from '../common/enums';
import { SalePayment } from '../sales/sale-payment.entity';
import { Station } from '../stations/station.entity';

@Entity('mobile_money_lines')
export class MobileMoneyLine extends BaseEntity {
  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId?: string | null;

  @ManyToOne(() => Station, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'station_id' })
  station?: Station | null;

  @Column({ length: 40 })
  provider!: string;

  @Column({ name: 'txn_date', type: 'date' })
  txnDate!: string;

  @Column({ length: 80 })
  reference!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: string;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod?: PaymentMethod | null;

  @Column({
    type: 'enum',
    enum: SettlementMatchStatus,
    default: SettlementMatchStatus.UNMATCHED,
  })
  status!: SettlementMatchStatus;

  @Column({ name: 'matched_payment_id', type: 'uuid', nullable: true })
  matchedPaymentId?: string | null;

  @ManyToOne(() => SalePayment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'matched_payment_id' })
  matchedPayment?: SalePayment | null;
}
