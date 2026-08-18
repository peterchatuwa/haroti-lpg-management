import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { AttachmentEntityType } from '../common/enums';
import { Attachment } from './attachment.entity';

@Injectable()
export class AttachmentsService {
  private readonly uploadDir =
    process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepo: Repository<Attachment>,
  ) {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  list(entityType: AttachmentEntityType, entityId: string) {
    return this.attachmentsRepo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async upload(params: {
    entityType: AttachmentEntityType;
    entityId: string;
    fileName: string;
    mimeType: string;
    dataBase64: string;
    uploadedById?: string;
    description?: string;
  }) {
    const buffer = Buffer.from(params.dataBase64, 'base64');
    const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `${params.entityType}/${params.entityId}/${Date.now()}-${safeName}`;
    const fullPath = join(this.uploadDir, storageKey);
    const dir = join(this.uploadDir, params.entityType, params.entityId);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(fullPath, buffer);

    return this.attachmentsRepo.save(
      this.attachmentsRepo.create({
        entityType: params.entityType,
        entityId: params.entityId,
        fileName: params.fileName,
        mimeType: params.mimeType,
        storageKey,
        sizeBytes: buffer.length,
        uploadedById: params.uploadedById,
        description: params.description,
      }),
    );
  }

  async findOne(id: string) {
    const attachment = await this.attachmentsRepo.findOne({ where: { id } });
    if (!attachment) throw new NotFoundException('Attachment not found');
    return attachment;
  }

  async download(id: string) {
    const attachment = await this.findOne(id);
    const fullPath = join(this.uploadDir, attachment.storageKey);
    if (!existsSync(fullPath)) {
      throw new NotFoundException('File not found on disk');
    }
    const stream = createReadStream(fullPath);
    return new StreamableFile(stream, {
      type: attachment.mimeType,
      disposition: `attachment; filename="${attachment.fileName}"`,
    });
  }
}
