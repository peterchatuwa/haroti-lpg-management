import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(params: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string;
    previousValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    reason?: string;
    ipAddress?: string;
    deviceInfo?: string;
    stationId?: string | null;
  }) {
    const entry = this.auditRepo.create(params);
    return this.auditRepo.save(entry);
  }

  findRecent(limit = 50) {
    return this.auditRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: { user: true },
    });
  }
}
