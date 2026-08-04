import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { ProcurementDocumentType } from '../common/enums';
import { User } from '../users/user.entity';
import { PurchaseOrder } from './purchase-order.entity';

@Entity('procurement_documents')
export class ProcurementDocument extends BaseEntity {
  @Column({ name: 'purchase_order_id' })
  purchaseOrderId!: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder!: PurchaseOrder;

  @Column({ name: 'document_type', type: 'enum', enum: ProcurementDocumentType })
  documentType!: ProcurementDocumentType;

  @Column({ name: 'document_number', unique: true, length: 40 })
  documentNumber!: string;

  @Column({ name: 'issued_at', type: 'timestamptz' })
  issuedAt!: Date;

  @Column({ type: 'text' })
  payload!: string;

  @Column({ name: 'generated_by_id', type: 'uuid', nullable: true })
  generatedById?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'generated_by_id' })
  generatedBy?: User | null;
}
