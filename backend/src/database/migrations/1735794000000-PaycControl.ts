import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaycControl1735794000000 implements MigrationInterface {
  name = 'PaycControl1735794000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE payc_meters
        ADD COLUMN IF NOT EXISTS valve_open boolean,
        ADD COLUMN IF NOT EXISTS battery_voltage decimal(6,2),
        ADD COLUMN IF NOT EXISTS cumulative_flow decimal(12,3),
        ADD COLUMN IF NOT EXISTS vendor_read_time timestamptz;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payc_commands (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        meter_id uuid NOT NULL REFERENCES payc_meters(id) ON DELETE CASCADE,
        command_type varchar(40) NOT NULL,
        vendor_value_id varchar(40),
        status varchar(20) NOT NULL DEFAULT 'PENDING',
        message text,
        requested_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payc_commands_meter_id
        ON payc_commands(meter_id, created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS payc_commands`);
    await queryRunner.query(`
      ALTER TABLE payc_meters
        DROP COLUMN IF EXISTS valve_open,
        DROP COLUMN IF EXISTS battery_voltage,
        DROP COLUMN IF EXISTS cumulative_flow,
        DROP COLUMN IF EXISTS vendor_read_time;
    `);
  }
}
