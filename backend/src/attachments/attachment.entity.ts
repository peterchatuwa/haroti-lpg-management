import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { AttachmentEntityType } from '../common/enums';

@Entity('attachments')
export class Attachment extends BaseEntity {
  @Column({ name: 'entity_type', type: 'enum', enum: AttachmentEntityType })
  entityType!: AttachmentEntityType;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId!: string;

  @Column({ name: 'file_name', length: 255 })
  fileName!: string;

  @Column({ name: 'mime_type', length: 120 })
  mimeType!: string;

  @Column({ name: 'storage_key', length: 500 })
  storageKey!: string;

  @Column({ type: 'int', default: 0 })
  sizeBytes!: number;

  @Column({ name: 'uploaded_by_id', type: 'uuid', nullable: true })
  uploadedById?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
