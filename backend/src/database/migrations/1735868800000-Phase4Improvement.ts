import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase4Improvement1735868800000 implements MigrationInterface {
  name = 'Phase4Improvement1735868800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE loyalty_txn_type_enum AS ENUM ('EARN','REDEEM','ADJUST');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE refill_request_status_enum AS ENUM (
        'PENDING','ACCEPTED','SCHEDULED','COMPLETED','CANCELLED'
      ); EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS loyalty_accounts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        customer_id uuid NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
        points_balance int NOT NULL DEFAULT 0,
        lifetime_earned int NOT NULL DEFAULT 0
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS loyalty_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        account_id uuid NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
        type loyalty_txn_type_enum NOT NULL,
        points int NOT NULL,
        balance_after int NOT NULL,
        description text,
        reference_type varchar(40),
        reference_id uuid
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS customer_otp_challenges (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        phone varchar(20) NOT NULL,
        code varchar(8) NOT NULL,
        expires_at timestamptz NOT NULL,
        attempts int NOT NULL DEFAULT 0
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS refill_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        request_number varchar(40) NOT NULL UNIQUE,
        customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        station_id uuid REFERENCES stations(id) ON DELETE SET NULL,
        quantity_kg decimal(10,3) NOT NULL DEFAULT 0,
        status refill_request_status_enum NOT NULL DEFAULT 'PENDING',
        preferred_date date,
        notes text
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS refill_requests`);
    await queryRunner.query(`DROP TABLE IF EXISTS customer_otp_challenges`);
    await queryRunner.query(`DROP TABLE IF EXISTS loyalty_transactions`);
    await queryRunner.query(`DROP TABLE IF EXISTS loyalty_accounts`);
  }
}
