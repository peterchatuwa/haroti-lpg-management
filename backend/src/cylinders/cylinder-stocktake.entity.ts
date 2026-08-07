import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { StocktakeStatus } from '../common/enums';
import { Station } from '../stations/station.entity';
import { User } from '../users/user.entity';
import { CylinderStocktakeLine } from './cylinder-stocktake-line.entity';

@Entity('cylinder_stocktakes')
export class CylinderStocktake extends BaseEntity {
  @Column({ name: 'station_id' })
  stationId!: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'station_id' })
  station!: Station;

  @Column({
    type: 'enum',
    enum: StocktakeStatus,
    default: StocktakeStatus.OPEN,
  })
  status!: StocktakeStatus;

  @Column({ name: 'started_by_id', type: 'uuid', nullable: true })
  startedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'started_by_id' })
  startedBy?: User;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt?: Date;

  @Column({ name: 'expected_count', type: 'int', default: 0 })
  expectedCount!: number;

  @Column({ name: 'scanned_count', type: 'int', default: 0 })
  scannedCount!: number;

  @OneToMany(() => CylinderStocktakeLine, (l) => l.stocktake, { cascade: true })
  lines!: CylinderStocktakeLine[];
}
