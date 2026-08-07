import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { AgeingService } from '../finance/ageing.service';
import { TanksService } from '../tanks/tanks.service';
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

  listRuns(limit = 20) {
    return this.jobRunsRepo.find({
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }
}
