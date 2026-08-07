import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Cylinder } from './cylinder.entity';
import { CylinderStocktake } from './cylinder-stocktake.entity';

@Entity('cylinder_stocktake_lines')
export class CylinderStocktakeLine extends BaseEntity {
  @Column({ name: 'stocktake_id' })
  stocktakeId!: string;

  @ManyToOne(() => CylinderStocktake, (s) => s.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stocktake_id' })
  stocktake!: CylinderStocktake;

  @Column({ name: 'cylinder_id', type: 'uuid', nullable: true })
  cylinderId?: string | null;

  @ManyToOne(() => Cylinder, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cylinder_id' })
  cylinder?: Cylinder | null;

  @Column({ name: 'serial_number', length: 80 })
  serialNumber!: string;

  @Column({ default: false })
  scanned!: boolean;

  @Column({ default: false })
  expected!: boolean;

  @Column({ default: false })
  exception!: boolean;
}
