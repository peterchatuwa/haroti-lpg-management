import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { TankReadingContext } from '../common/enums';
import { User } from '../users/user.entity';
import { Tank } from './tank.entity';

@Entity('tank_readings')
export class TankReading extends BaseEntity {
  @Column({ name: 'tank_id' })
  tankId!: string;

  @ManyToOne(() => Tank, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tank_id' })
  tank!: Tank;

  @Column({
    name: 'reading_kg',
    type: 'decimal',
    precision: 12,
    scale: 3,
  })
  readingKg!: string;

  @Column({ type: 'enum', enum: TankReadingContext })
  context!: TankReadingContext;

  @Column({ name: 'reference_type', length: 40, nullable: true })
  referenceType?: string;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId?: string;

  @Column({ name: 'recorded_by_id', type: 'uuid', nullable: true })
  recordedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'recorded_by_id' })
  recordedBy?: User;

  @Column({ name: 'recorded_at', type: 'timestamptz', default: () => 'NOW()' })
  recordedAt!: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
