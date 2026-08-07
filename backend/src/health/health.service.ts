import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async readiness() {
    const checks: Record<string, string> = { api: 'ok' };

    try {
      await this.dataSource.query('SELECT 1');
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    const redisHost = this.config.get('REDIS_HOST');
    if (redisHost) {
      checks.redis = 'configured';
    } else {
      checks.redis = 'optional';
    }

    const ready = checks.database === 'ok';
    return { status: ready ? 'ready' : 'degraded', checks };
  }
}
