import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { CylinderMovementType } from '../common/enums';
import { Customer } from '../customers/customer.entity';
import { Cylinder } from '../cylinders/cylinder.entity';
import { Station } from '../stations/station.entity';

@Entity('cylinder_movements')
export class CylinderMovement extends BaseEntity {
  @Column({ name: 'cylinder_id' })
  cylinderId!: string;

  @ManyToOne(() => Cylinder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cylinder_id' })
  cylinder!: Cylinder;

  @Column({ type: 'enum', enum: CylinderMovementType })
  type!: CylinderMovementType;

  @Column({ name: 'from_station_id', type: 'uuid', nullable: true })
  fromStationId?: string | null;

  @Column({ name: 'to_station_id', type: 'uuid', nullable: true })
  toStationId?: string | null;

  @ManyToOne(() => Station, { nullable: true })
  @JoinColumn({ name: 'to_station_id' })
  toStation?: Station | null;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId?: string | null;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;

  @Column({ name: 'reference_type', length: 40, nullable: true })
  referenceType?: string;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
