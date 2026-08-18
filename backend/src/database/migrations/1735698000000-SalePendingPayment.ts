import { MigrationInterface, QueryRunner } from 'typeorm';

export class SalePendingPayment1735698000000 implements MigrationInterface {
  name = 'SalePendingPayment1735698000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE r RECORD;
      BEGIN
        FOR r IN
          SELECT DISTINCT t.typname
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE e.enumlabel = 'PENDING_APPROVAL'
        LOOP
          EXECUTE format(
            'ALTER TYPE %I ADD VALUE IF NOT EXISTS ''PENDING_PAYMENT''',
            r.typname
          );
        END LOOP;
      END $$;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Postgres does not support removing enum values safely.
  }
}
