import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { PaycMeterStatus } from '../common/enums';
import { Customer } from '../customers/customer.entity';
import { Station } from '../stations/station.entity';

@Entity('payc_meters')
export class PaycMeter extends BaseEntity {
  @Column({ name: 'meter_serial', unique: true, length: 60 })
  meterSerial!: string;

  @Column({ name: 'imei', length: 40, nullable: true })
  imei?: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId?: string | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId?: string | null;

  @ManyToOne(() => Station, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'station_id' })
  station?: Station | null;

  @Column({
    name: 'credit_balance_kg',
    type: 'decimal',
    precision: 10,
    scale: 3,
    default: 0,
  })
  creditBalanceKg!: string;

  @Column({
    name: 'deferred_revenue',
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
  })
  deferredRevenue!: string;

  @Column({
    name: 'daily_burn_kg',
    type: 'decimal',
    precision: 8,
    scale: 3,
    default: 0,
  })
  dailyBurnKg!: string;

  @Column({
    type: 'enum',
    enum: PaycMeterStatus,
    default: PaycMeterStatus.ACTIVE,
  })
  status!: PaycMeterStatus;

  @Column({ name: 'last_telemetry_at', type: 'timestamptz', nullable: true })
  lastTelemetryAt?: Date;

  @Column({ name: 'cylinder_serial', length: 60, nullable: true })
  cylinderSerial?: string;

  @Column({ length: 160, nullable: true })
  location?: string;

  @Column({ name: 'valve_open', type: 'boolean', nullable: true })
  valveOpen?: boolean | null;

  @Column({
    name: 'battery_voltage',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
  })
  batteryVoltage?: string | null;

  @Column({
    name: 'cumulative_flow',
    type: 'decimal',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  cumulativeFlow?: string | null;

  @Column({ name: 'vendor_read_time', type: 'timestamptz', nullable: true })
  vendorReadTime?: Date | null;

  @Column({ name: 'leakage_detected', default: false })
  leakageDetected!: boolean;

  @Column({ name: 'tamper_detected', default: false })
  tamperDetected!: boolean;

  @Column({ name: 'low_battery_alert', default: false })
  lowBatteryAlert!: boolean;

  @Column({ name: 'safety_alert_summary', type: 'text', nullable: true })
  safetyAlertSummary?: string | null;

  @Column({ name: 'safety_checked_at', type: 'timestamptz', nullable: true })
  safetyCheckedAt?: Date | null;
}
