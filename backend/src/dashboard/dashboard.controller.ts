import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../audit/audit-log.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  @Get('overview')
  overview() {
    return this.dashboardService.overview();
  }

  @Get('audit')
  audit() {
    return this.auditRepo.find({
      order: { createdAt: 'DESC' },
      take: 50,
      relations: { user: true },
    });
  }
}
