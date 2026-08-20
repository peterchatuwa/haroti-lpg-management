import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaycSafetyAlerts1735880400000 implements MigrationInterface {
  name = 'PaycSafetyAlerts1735880400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE payc_meters
        ADD COLUMN IF NOT EXISTS leakage_detected boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS tamper_detected boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS low_battery_alert boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS safety_alert_summary text,
        ADD COLUMN IF NOT EXISTS safety_checked_at timestamptz;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE payc_meters
        DROP COLUMN IF EXISTS leakage_detected,
        DROP COLUMN IF EXISTS tamper_detected,
        DROP COLUMN IF EXISTS low_battery_alert,
        DROP COLUMN IF EXISTS safety_alert_summary,
        DROP COLUMN IF EXISTS safety_checked_at;
    `);
  }
}
