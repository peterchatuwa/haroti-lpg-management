import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaycService } from '../payc/payc.service';
import { PaychanguService } from '../paychangu/paychangu.service';
import { SafetyService } from '../safety/safety.service';
import { AgeingService } from '../finance/ageing.service';
import { TanksService } from '../tanks/tanks.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { JobRun } from './job-run.entity';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectRepository(JobRun)
    private readonly jobRunsRepo: Repository<JobRun>,
    private readonly maintenanceService: MaintenanceService,
    private readonly tanksService: TanksService,
    private readonly ageingService: AgeingService,
    private readonly safetyService: SafetyService,
    private readonly workflowsService: WorkflowsService,
    private readonly notificationsService: NotificationsService,
    private readonly paycService: PaycService,
    @Inject(forwardRef(() => PaychanguService))
    private readonly paychanguService: PaychanguService,
  ) {}

  private async track(jobName: string, fn: () => Promise<string>) {
    const run = await this.jobRunsRepo.save(
      this.jobRunsRepo.create({
        jobName,
        status: 'RUNNING',
        startedAt: new Date(),
      }),
    );
    try {
      const summary = await fn();
      run.status = 'SUCCESS';
      run.summary = summary;
      run.finishedAt = new Date();
      await this.jobRunsRepo.save(run);
      this.logger.log(`${jobName}: ${summary}`);
    } catch (err) {
      run.status = 'FAILED';
      run.errorMessage = err instanceof Error ? err.message : String(err);
      run.finishedAt = new Date();
      await this.jobRunsRepo.save(run);
      this.logger.error(`${jobName} failed`, run.errorMessage);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async hydroTestJob() {
    await this.track('hydro-test-orders', async () => {
      const created = await this.maintenanceService.createHydroTestOrders();
      return `Created ${created.length} hydro work order(s)`;
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async stockIntegrityJob() {
    await this.track('stock-integrity', async () => {
      const result = await this.tanksService.stockIntegrityCheck();
      return `${result.issueCount} station(s) with stock mismatch`;
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async ageingReportJob() {
    await this.track('ageing-report', async () => {
      const snapshot = await this.ageingService.snapshot();
      return `AR total MWK ${snapshot.ar.total}, AP total MWK ${snapshot.ap.total}`;
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async maintenancePlanJob() {
    await this.track('maintenance-plans', async () => {
      const created = await this.maintenanceService.runDuePlans();
      return `Created ${created.length} preventive work order(s)`;
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async complianceStatusJob() {
    await this.track('compliance-status', async () => {
      const result = await this.safetyService.refreshComplianceStatuses();
      return `Refreshed ${result.updated} compliance item(s)`;
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async approvalEscalationJob() {
    await this.track('approval-escalation', async () => {
      const result = await this.workflowsService.escalateOverdue();
      return `Escalated ${result.escalated} approval task(s)`;
    });
  }

  @Cron('*/15 * * * *')
  async paycSyncAndAlertsJob() {
    await this.track('payc-sync-alerts', async () => {
      const result = await this.paycService.runScheduledSyncAndAlerts();
      if (typeof result.skipped === 'string') return `Skipped: ${result.skipped}`;
      return `Synced ${result.synced} meter(s), sent ${result.alertsSent} alert(s)`;
    });
  }

  @Cron('*/5 * * * *')
  async notificationQueueJob() {
    await this.track('notification-queue', async () => {
      const result = await this.notificationsService.processQueue();
      return `Processed ${result.processed}, sent ${result.sent}, failed ${result.failed}`;
    });
  }

  @Cron('*/3 * * * *')
  async paycCommandRefreshJob() {
    await this.track('payc-command-refresh', async () => {
      const result = await this.paycService.refreshPendingCommands();
      return `Refreshed ${result.updated} pending command(s)`;
    });
  }

  @Cron('*/2 * * * *')
  async paychanguPendingSyncJob() {
    await this.track('paychangu-pending-sync', async () => {
      const result = await this.paychanguService.syncPendingPayments();
      return `Checked ${result.checked}, resolved ${result.resolved}, errors ${result.errors}`;
    });
  }

  listRuns(limit = 20) {
    return this.jobRunsRepo.find({
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }
}
