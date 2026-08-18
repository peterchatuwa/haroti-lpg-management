import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase1Improvement1735695000000 implements MigrationInterface {
  name = 'Phase1Improvement1735695000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE target_metric_enum AS ENUM ('REVENUE', 'KG', 'MARGIN');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE target_scope_enum AS ENUM ('NETWORK', 'STATION');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE target_period_enum AS ENUM ('DAY', 'WEEK', 'MONTH');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE attachment_entity_type_enum AS ENUM (
          'PROCUREMENT', 'DELIVERY', 'CYLINDER', 'WORK_ORDER',
          'EXPENSE', 'REQUISITION', 'CUSTOMER', 'SUPPLIER_INVOICE'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE supplier_invoice_status_enum AS ENUM (
          'DRAFT', 'REGISTERED', 'MATCHED', 'VARIANCE', 'PAID'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE three_way_match_status_enum AS ENUM (
          'PENDING', 'MATCHED', 'VARIANCE', 'APPROVED'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS targets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        scope target_scope_enum NOT NULL,
        station_id uuid REFERENCES stations(id) ON DELETE CASCADE,
        metric target_metric_enum NOT NULL,
        period_type target_period_enum NOT NULL,
        year int NOT NULL,
        period int NOT NULL,
        target_value decimal(14,2) NOT NULL,
        notes text
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        account_name varchar(120) NOT NULL,
        bank_name varchar(80) NOT NULL,
        account_mask varchar(20) NOT NULL,
        gl_account_code varchar(10) NOT NULL,
        currency varchar(10) NOT NULL DEFAULT 'MWK',
        is_active boolean NOT NULL DEFAULT true
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS bank_statement_lines (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        bank_account_id uuid NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
        txn_date date NOT NULL,
        reference varchar(120) NOT NULL,
        description text,
        amount decimal(14,2) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'UNMATCHED',
        matched_entity_type varchar(40),
        matched_entity_id uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS supplier_invoices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        invoice_number varchar(60) NOT NULL,
        supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
        purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
        invoice_date date NOT NULL,
        due_date date,
        amount decimal(14,2) NOT NULL,
        tax_amount decimal(14,2) NOT NULL DEFAULT 0,
        status supplier_invoice_status_enum NOT NULL DEFAULT 'REGISTERED',
        match_status three_way_match_status_enum NOT NULL DEFAULT 'PENDING',
        variance_amount decimal(14,2),
        notes text
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        entity_type attachment_entity_type_enum NOT NULL,
        entity_id uuid NOT NULL,
        file_name varchar(255) NOT NULL,
        mime_type varchar(120) NOT NULL,
        storage_key varchar(500) NOT NULL,
        size_bytes int NOT NULL DEFAULT 0,
        uploaded_by_id uuid,
        description text
      );
    `);

    await queryRunner.query(`
      ALTER TABLE suppliers
        ADD COLUMN IF NOT EXISTS legal_name varchar(160),
        ADD COLUMN IF NOT EXISTS trading_name varchar(160),
        ADD COLUMN IF NOT EXISTS tax_id varchar(40),
        ADD COLUMN IF NOT EXISTS payment_terms_days int NOT NULL DEFAULT 30,
        ADD COLUMN IF NOT EXISTS bank_account_mask varchar(30),
        ADD COLUMN IF NOT EXISTS is_approved_vendor boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS category varchar(80);
    `);

    await queryRunner.query(`
      ALTER TABLE mobile_money_lines
        ADD COLUMN IF NOT EXISTS fee_amount decimal(14,2),
        ADD COLUMN IF NOT EXISTS net_amount decimal(14,2),
        ADD COLUMN IF NOT EXISTS settlement_batch varchar(60);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE mobile_money_lines DROP COLUMN IF EXISTS settlement_batch`,
    );
    await queryRunner.query(
      `ALTER TABLE mobile_money_lines DROP COLUMN IF EXISTS net_amount`,
    );
    await queryRunner.query(
      `ALTER TABLE mobile_money_lines DROP COLUMN IF EXISTS fee_amount`,
    );
    await queryRunner.query(
      `ALTER TABLE suppliers DROP COLUMN IF EXISTS category`,
    );
    await queryRunner.query(
      `ALTER TABLE suppliers DROP COLUMN IF EXISTS is_approved_vendor`,
    );
    await queryRunner.query(
      `ALTER TABLE suppliers DROP COLUMN IF EXISTS bank_account_mask`,
    );
    await queryRunner.query(
      `ALTER TABLE suppliers DROP COLUMN IF EXISTS payment_terms_days`,
    );
    await queryRunner.query(
      `ALTER TABLE suppliers DROP COLUMN IF EXISTS tax_id`,
    );
    await queryRunner.query(
      `ALTER TABLE suppliers DROP COLUMN IF EXISTS trading_name`,
    );
    await queryRunner.query(
      `ALTER TABLE suppliers DROP COLUMN IF EXISTS legal_name`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS attachments`);
    await queryRunner.query(`DROP TABLE IF EXISTS supplier_invoices`);
    await queryRunner.query(`DROP TABLE IF EXISTS bank_statement_lines`);
    await queryRunner.query(`DROP TABLE IF EXISTS bank_accounts`);
    await queryRunner.query(`DROP TABLE IF EXISTS targets`);
  }
}
