import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase0Improvement1735694000000 implements MigrationInterface {
  name = 'Phase0Improvement1735694000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "journal_posting_status_enum" AS ENUM ('POSTED', 'REVERSED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "fiscal_period_status_enum" AS ENUM ('OPEN', 'SOFT_CLOSED', 'HARD_CLOSED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "loss_cases_status_enum" ADD VALUE IF NOT EXISTS 'ASSIGNED';
      EXCEPTION WHEN others THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "loss_cases_status_enum" ADD VALUE IF NOT EXISTS 'INVESTIGATING';
      EXCEPTION WHEN others THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "loss_cases_status_enum" ADD VALUE IF NOT EXISTS 'ROOT_CAUSE_IDENTIFIED';
      EXCEPTION WHEN others THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "loss_cases_status_enum" ADD VALUE IF NOT EXISTS 'ACTION_REQUIRED';
      EXCEPTION WHEN others THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "loss_cases_status_enum" ADD VALUE IF NOT EXISTS 'CLOSED';
      EXCEPTION WHEN others THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "loss_case_category_enum" AS ENUM (
          'METER_ERROR','LEAKAGE','VENTING','DELIVERY_VARIANCE','THEFT','DATA_ENTRY','MEASUREMENT','UNKNOWN'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "journal_entries_eventtype_enum" ADD VALUE IF NOT EXISTS 'SALE_REVERSAL';
      EXCEPTION WHEN others THEN null; END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE journal_entries
        ADD COLUMN IF NOT EXISTS posting_status journal_posting_status_enum DEFAULT 'POSTED',
        ADD COLUMN IF NOT EXISTS reverses_entry_id uuid,
        ADD COLUMN IF NOT EXISTS reversed_by_entry_id uuid,
        ADD COLUMN IF NOT EXISTS reversal_reason text;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS fiscal_periods (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        year int NOT NULL,
        period int NOT NULL,
        start_date date NOT NULL,
        end_date date NOT NULL,
        status fiscal_period_status_enum NOT NULL DEFAULT 'OPEN',
        closed_by_id uuid,
        closed_at timestamptz,
        UNIQUE(year, period)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS posting_rules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        event_type journal_entries_eventtype_enum NOT NULL,
        line_role varchar(40) NOT NULL,
        account_code varchar(10) NOT NULL,
        account_name varchar(120) NOT NULL,
        side varchar(10) NOT NULL DEFAULT 'DEBIT',
        effective_from date NOT NULL,
        effective_to date,
        is_active boolean NOT NULL DEFAULT true,
        version int NOT NULL DEFAULT 1
      );
    `);

    await queryRunner.query(`
      ALTER TABLE loss_cases
        ADD COLUMN IF NOT EXISTS category loss_case_category_enum,
        ADD COLUMN IF NOT EXISTS investigator_id uuid,
        ADD COLUMN IF NOT EXISTS wac_value_mwk decimal(14,2),
        ADD COLUMN IF NOT EXISTS root_cause text,
        ADD COLUMN IF NOT EXISTS corrective_action text;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS loss_case_actions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        loss_case_id uuid NOT NULL REFERENCES loss_cases(id) ON DELETE CASCADE,
        description varchar(200) NOT NULL,
        assigned_to_id uuid,
        due_date date,
        completed boolean NOT NULL DEFAULT false,
        completed_at timestamptz
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS job_runs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        job_name varchar(80) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'RUNNING',
        started_at timestamptz NOT NULL,
        finished_at timestamptz,
        summary text,
        error_message text
      );
    `);

    await queryRunner.query(`
      INSERT INTO fiscal_periods (year, period, start_date, end_date, status)
      SELECT 2026, 8, '2026-08-01', '2026-08-31', 'OPEN'
      WHERE NOT EXISTS (SELECT 1 FROM fiscal_periods WHERE year = 2026 AND period = 8);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS job_runs`);
    await queryRunner.query(`DROP TABLE IF EXISTS loss_case_actions`);
    await queryRunner.query(`DROP TABLE IF EXISTS posting_rules`);
    await queryRunner.query(`DROP TABLE IF EXISTS fiscal_periods`);
  }
}
