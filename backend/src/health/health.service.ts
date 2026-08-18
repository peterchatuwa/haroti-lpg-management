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

    try {
      const tables = (await this.dataSource.query(
        `SELECT to_regclass('public.paychangu_transactions') IS NOT NULL AS ok`,
      )) as Array<{ ok: boolean }>;
      checks.paychangu_tables =
        tables[0]?.ok === true ? 'ok' : 'paychangu_transactions_missing';

      const enums = (await this.dataSource.query(
        `SELECT 1 FROM pg_enum e
         JOIN pg_type t ON e.enumtypid = t.oid
         WHERE e.enumlabel = 'PENDING_PAYMENT'
         LIMIT 1`,
      )) as unknown[];
      checks.paychangu_migration =
        enums.length > 0 ? 'ok' : 'pending_payment_enum_missing';
    } catch {
      checks.paychangu_migration = 'check_failed';
    }

    const paychanguSecret = this.config.get<string>('PAYCHANGU_SECRET_KEY')?.trim();
    const paychanguApiKey = this.config.get<string>('PAYCHANGU_API_KEY')?.trim();
    checks.paychangu_config = paychanguSecret
      ? 'secret_configured'
      : paychanguApiKey?.startsWith('sec-')
        ? 'secret_in_api_key_var'
        : 'secret_missing';

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
