import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase3Improvement1735782400000 implements MigrationInterface {
  name = 'Phase3Improvement1735782400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE approval_task_status_enum AS ENUM (
        'PENDING','APPROVED','REJECTED','ESCALATED','EXPIRED'
      ); EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE notification_channel_enum AS ENUM (
        'IN_APP','EMAIL','SMS','WHATSAPP'
      ); EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE notification_status_enum AS ENUM (
        'PENDING','DELIVERED','FAILED','READ'
      ); EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE notification_delivery_status_enum AS ENUM (
        'QUEUED','SENT','FAILED'
      ); EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE iot_device_type_enum AS ENUM (
        'TANK_LEVEL','PRESSURE','TEMPERATURE'
      ); EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE iot_device_status_enum AS ENUM (
        'ACTIVE','INACTIVE','FAULT'
      ); EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS workflow_definitions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        name varchar(120) NOT NULL,
        entity_type varchar(40) NOT NULL,
        min_amount decimal(14,2) NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS workflow_steps (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        definition_id uuid NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
        step_order int NOT NULL,
        approver_role varchar(40) NOT NULL,
        escalation_hours int NOT NULL DEFAULT 24,
        fallback_role varchar(40)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS approval_tasks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        task_number varchar(40) NOT NULL UNIQUE,
        entity_type varchar(40) NOT NULL,
        entity_id uuid NOT NULL,
        amount decimal(14,2) NOT NULL DEFAULT 0,
        status approval_task_status_enum NOT NULL DEFAULT 'PENDING',
        current_step int NOT NULL DEFAULT 1,
        assigned_role varchar(40) NOT NULL,
        due_at timestamptz NOT NULL,
        requester_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        station_id uuid REFERENCES stations(id) ON DELETE SET NULL,
        summary text,
        resolved_at timestamptz,
        resolved_by_id uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        event_type varchar(60) NOT NULL,
        title varchar(200) NOT NULL,
        body text NOT NULL,
        status notification_status_enum NOT NULL DEFAULT 'PENDING',
        read_at timestamptz,
        entity_type varchar(40),
        entity_id uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_deliveries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
        channel notification_channel_enum NOT NULL,
        recipient varchar(120),
        status notification_delivery_status_enum NOT NULL DEFAULT 'QUEUED',
        attempts int NOT NULL DEFAULT 0,
        provider_ref varchar(120),
        last_error text,
        next_retry_at timestamptz
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_type varchar(60) NOT NULL,
        channel notification_channel_enum NOT NULL,
        enabled boolean NOT NULL DEFAULT true,
        is_mandatory boolean NOT NULL DEFAULT false,
        UNIQUE(user_id, event_type, channel)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS iot_devices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        device_key varchar(80) NOT NULL UNIQUE,
        name varchar(120) NOT NULL,
        type iot_device_type_enum NOT NULL,
        status iot_device_status_enum NOT NULL DEFAULT 'ACTIVE',
        station_id uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
        tank_id uuid REFERENCES tanks(id) ON DELETE SET NULL,
        last_seen_at timestamptz
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS telemetry_readings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        device_id uuid NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
        raw_payload jsonb,
        level_kg decimal(12,3),
        pressure_bar decimal(8,3),
        temperature_c decimal(6,2),
        recorded_at timestamptz NOT NULL
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS telemetry_readings`);
    await queryRunner.query(`DROP TABLE IF EXISTS iot_devices`);
    await queryRunner.query(`DROP TABLE IF EXISTS notification_preferences`);
    await queryRunner.query(`DROP TABLE IF EXISTS notification_deliveries`);
    await queryRunner.query(`DROP TABLE IF EXISTS notifications`);
    await queryRunner.query(`DROP TABLE IF EXISTS approval_tasks`);
    await queryRunner.query(`DROP TABLE IF EXISTS workflow_steps`);
    await queryRunner.query(`DROP TABLE IF EXISTS workflow_definitions`);
  }
}
