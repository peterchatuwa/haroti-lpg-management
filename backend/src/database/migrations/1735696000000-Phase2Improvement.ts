import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase2Improvement1735696000000 implements MigrationInterface {
  name = 'Phase2Improvement1735696000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE incident_type_enum AS ENUM (
        'GAS_LEAK','FIRE','INJURY','VEHICLE_INCIDENT','EQUIPMENT_FAILURE','UNSAFE_ACT','NEAR_MISS','OTHER'
      ); EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE incident_severity_enum AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE incident_status_enum AS ENUM (
        'OPEN','TRIAGED','INVESTIGATING','CORRECTIVE_ACTION','REVIEW','CLOSED'
      ); EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE compliance_item_type_enum AS ENUM (
        'PERMIT','TANK_INSPECTION','FIRE_EQUIPMENT','SCALE_CALIBRATION','INSURANCE','CYLINDER_CERTIFICATE','OTHER'
      ); EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE compliance_item_status_enum AS ENUM ('VALID','EXPIRING_SOON','EXPIRED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE stocktake_status_enum AS ENUM ('OPEN','CLOSED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE stations
        ADD COLUMN IF NOT EXISTS latitude decimal(10,6),
        ADD COLUMN IF NOT EXISTS longitude decimal(10,6),
        ADD COLUMN IF NOT EXISTS min_stock_kg decimal(12,3),
        ADD COLUMN IF NOT EXISTS reorder_level_kg decimal(12,3),
        ADD COLUMN IF NOT EXISTS safety_stock_kg decimal(12,3);
    `);

    await queryRunner.query(`
      ALTER TABLE deliveries
        ADD COLUMN IF NOT EXISTS expected_arrival_at timestamptz;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cylinder_stocktakes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        station_id uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
        status stocktake_status_enum NOT NULL DEFAULT 'OPEN',
        started_by_id uuid,
        closed_at timestamptz,
        expected_count int NOT NULL DEFAULT 0,
        scanned_count int NOT NULL DEFAULT 0
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cylinder_stocktake_lines (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        stocktake_id uuid NOT NULL REFERENCES cylinder_stocktakes(id) ON DELETE CASCADE,
        cylinder_id uuid REFERENCES cylinders(id) ON DELETE SET NULL,
        serial_number varchar(80) NOT NULL,
        scanned boolean NOT NULL DEFAULT false,
        expected boolean NOT NULL DEFAULT false,
        exception boolean NOT NULL DEFAULT false
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS safety_incidents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        incident_number varchar(40) NOT NULL UNIQUE,
        type incident_type_enum NOT NULL,
        severity incident_severity_enum NOT NULL,
        status incident_status_enum NOT NULL DEFAULT 'OPEN',
        station_id uuid REFERENCES stations(id) ON DELETE SET NULL,
        occurred_at timestamptz NOT NULL,
        description text NOT NULL,
        immediate_action text,
        investigator_id uuid,
        root_cause text,
        reported_by_id uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS compliance_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        title varchar(160) NOT NULL,
        type compliance_item_type_enum NOT NULL,
        station_id uuid REFERENCES stations(id) ON DELETE CASCADE,
        issue_date date,
        expiry_date date NOT NULL,
        status compliance_item_status_enum NOT NULL DEFAULT 'VALID',
        notes text,
        document_ref varchar(120)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS maintenance_plans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        name varchar(120) NOT NULL,
        asset_category varchar(40) NOT NULL,
        station_id uuid REFERENCES stations(id) ON DELETE CASCADE,
        asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
        interval_days int NOT NULL,
        next_due_date date NOT NULL,
        last_run_date date,
        is_active boolean NOT NULL DEFAULT true,
        description text
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS delivery_allocations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        bulk_delivery_id uuid REFERENCES deliveries(id) ON DELETE CASCADE,
        station_id uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
        allocated_kg decimal(12,3) NOT NULL,
        delivered_kg decimal(12,3) NOT NULL DEFAULT 0,
        status varchar(20) NOT NULL DEFAULT 'PLANNED',
        notes text
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS delivery_allocations`);
    await queryRunner.query(`DROP TABLE IF EXISTS maintenance_plans`);
    await queryRunner.query(`DROP TABLE IF EXISTS compliance_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS safety_incidents`);
    await queryRunner.query(`DROP TABLE IF EXISTS cylinder_stocktake_lines`);
    await queryRunner.query(`DROP TABLE IF EXISTS cylinder_stocktakes`);
    await queryRunner.query(
      `ALTER TABLE deliveries DROP COLUMN IF EXISTS expected_arrival_at`,
    );
    await queryRunner.query(
      `ALTER TABLE stations DROP COLUMN IF EXISTS safety_stock_kg`,
    );
    await queryRunner.query(
      `ALTER TABLE stations DROP COLUMN IF EXISTS reorder_level_kg`,
    );
    await queryRunner.query(
      `ALTER TABLE stations DROP COLUMN IF EXISTS min_stock_kg`,
    );
    await queryRunner.query(
      `ALTER TABLE stations DROP COLUMN IF EXISTS longitude`,
    );
    await queryRunner.query(
      `ALTER TABLE stations DROP COLUMN IF EXISTS latitude`,
    );
  }
}
