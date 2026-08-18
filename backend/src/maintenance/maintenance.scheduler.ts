import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';

/** Runs hydro-test work-order generation once daily at startup and every 24h. */
@Injectable()
export class MaintenanceScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MaintenanceScheduler.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly maintenanceService: MaintenanceService) {}

  onModuleInit() {
    void this.runHydroJob();
    this.timer = setInterval(
      () => void this.runHydroJob(),
      24 * 60 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async runHydroJob() {
    try {
      const created = await this.maintenanceService.createHydroTestOrders();
      if (created.length) {
        this.logger.log(`Created ${created.length} hydro-test work order(s)`);
      }
    } catch (err) {
      this.logger.warn(`Hydro scheduling job failed: ${String(err)}`);
    }
  }
}
