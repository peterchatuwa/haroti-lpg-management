import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaychanguPaycIntegration1735697000000
  implements MigrationInterface
{
  name = 'PaychanguPaycIntegration1735697000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE r RECORD;
      BEGIN
        FOR r IN
          SELECT DISTINCT t.typname
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE e.enumlabel = 'AIRTEL_MONEY'
        LOOP
          EXECUTE format(
            'ALTER TYPE %I ADD VALUE IF NOT EXISTS ''PAYCHANGU''',
            r.typname
          );
        END LOOP;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE paychangu_transaction_status_enum AS ENUM (
          'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE paychangu_payment_method_enum AS ENUM (
          'AIRTEL_MONEY', 'TNM_MPAMBA', 'CARD', 'BANK_TRANSFER'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS paychangu_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        transaction_ref varchar(120) NOT NULL UNIQUE,
        internal_ref varchar(120) NOT NULL,
        payment_method paychangu_payment_method_enum NOT NULL,
        amount decimal(14,2) NOT NULL,
        status paychangu_transaction_status_enum NOT NULL,
        customer_phone varchar(20),
        customer_email varchar(100),
        paychangu_reference varchar(120),
        callback_url varchar(255),
        completed_at timestamptz,
        metadata jsonb,
        sale_id uuid REFERENCES sales(id) ON DELETE SET NULL,
        payc_meter_id uuid REFERENCES payc_meters(id) ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS paychangu_webhooks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        event_type varchar(80) NOT NULL,
        transaction_ref varchar(120) NOT NULL,
        payload jsonb NOT NULL,
        processed boolean NOT NULL DEFAULT false,
        processed_at timestamptz,
        error_message text
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS paychangu_webhooks;`);
    await queryRunner.query(`DROP TABLE IF EXISTS paychangu_transactions;`);
    await queryRunner.query(`DROP TYPE IF EXISTS paychangu_payment_method_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS paychangu_transaction_status_enum;`);
  }
}
