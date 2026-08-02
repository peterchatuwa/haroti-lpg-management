import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { TransferItemType } from '../common/enums';
import { Transfer } from './transfer.entity';

@Entity('transfer_items')
export class TransferItem extends BaseEntity {
  @Column({ name: 'transfer_id' })
  transferId!: string;

  @ManyToOne(() => Transfer, (transfer) => transfer.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transfer_id' })
  transfer!: Transfer;

  @Column({ type: 'enum', enum: TransferItemType })
  itemType!: TransferItemType;

  @Column({ name: 'description', length: 160 })
  description!: string;

  @Column({
    name: 'quantity_dispatched',
    type: 'decimal',
    precision: 12,
    scale: 3,
    default: 0,
  })
  quantityDispatched!: string;

  @Column({
    name: 'quantity_received',
    type: 'decimal',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  quantityReceived?: string;

  @Column({ name: 'cylinder_serial', length: 80, nullable: true })
  cylinderSerial?: string;

  @Column({ name: 'unit', length: 20, default: 'kg' })
  unit!: string;
}