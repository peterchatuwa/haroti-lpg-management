import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ComplianceItemStatus,
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
} from '../common/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { ComplianceItem } from './compliance-item.entity';
import { SafetyIncident } from './safety-incident.entity';

@Injectable()
export class SafetyService {
  constructor(
    @InjectRepository(SafetyIncident)
    private readonly incidentsRepo: Repository<SafetyIncident>,
    @InjectRepository(ComplianceItem)
    private readonly complianceRepo: Repository<ComplianceItem>,
    private readonly notificationsService: NotificationsService,
  ) {}

  listIncidents(stationId?: string) {
    return this.incidentsRepo.find({
      where: stationId ? { stationId } : {},
      relations: { station: true, investigator: true },
      order: { occurredAt: 'DESC' },
      take: 100,
    });
  }

  async createIncident(dto: {
    type: IncidentType;
    severity: string;
    stationId?: string;
    description: string;
    immediateAction?: string;
    reportedById?: string;
  }) {
    const stamp = Date.now().toString().slice(-6);
    const incident = await this.incidentsRepo.save(
      this.incidentsRepo.create({
        incidentNumber: `INC-${stamp}`,
        type: dto.type,
        severity: dto.severity as never,
        stationId: dto.stationId,
        description: dto.description,
        immediateAction: dto.immediateAction,
        reportedById: dto.reportedById,
        occurredAt: new Date(),
        status: IncidentStatus.OPEN,
      }),
    );

    if (
      dto.severity === IncidentSeverity.HIGH ||
      dto.severity === IncidentSeverity.CRITICAL
    ) {
      await this.notificationsService.dispatch({
        eventType: 'safety.critical_incident',
        title: `Critical safety incident: ${dto.type}`,
        body: dto.description,
        entityType: 'INCIDENT',
        entityId: incident.id,
        mandatory: true,
      });
    }

    return incident;
  }

  async updateIncident(
    id: string,
    dto: {
      status?: IncidentStatus;
      investigatorId?: string;
      rootCause?: string;
      immediateAction?: string;
    },
  ) {
    const incident = await this.incidentsRepo.findOne({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');
    Object.assign(incident, dto);
    return this.incidentsRepo.save(incident);
  }

  listCompliance(stationId?: string) {
    return this.complianceRepo.find({
      where: stationId ? { stationId } : {},
      relations: { station: true },
      order: { expiryDate: 'ASC' },
      take: 200,
    });
  }

  async createCompliance(dto: {
    title: string;
    type: string;
    stationId?: string;
    issueDate?: string;
    expiryDate: string;
    notes?: string;
    documentRef?: string;
  }) {
    return this.complianceRepo.save(
      this.complianceRepo.create({
        title: dto.title,
        type: dto.type as never,
        stationId: dto.stationId,
        issueDate: dto.issueDate,
        expiryDate: dto.expiryDate,
        notes: dto.notes,
        documentRef: dto.documentRef,
        status: this.statusForExpiry(dto.expiryDate),
      }),
    );
  }

  private statusForExpiry(expiryDate: string): ComplianceItemStatus {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    if (expiry < today) return ComplianceItemStatus.EXPIRED;
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 30);
    if (expiry <= soon) return ComplianceItemStatus.EXPIRING_SOON;
    return ComplianceItemStatus.VALID;
  }

  async refreshComplianceStatuses() {
    const items = await this.complianceRepo.find();
    for (const item of items) {
      item.status = this.statusForExpiry(item.expiryDate);
    }
    await this.complianceRepo.save(items);
    return { updated: items.length };
  }

  calendar(daysAhead = 90) {
    const until = new Date();
    until.setDate(until.getDate() + daysAhead);
    return this.complianceRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.station', 'station')
      .where('c.expiry_date <= :until', {
        until: until.toISOString().slice(0, 10),
      })
      .orderBy('c.expiry_date', 'ASC')
      .getMany();
  }
}
