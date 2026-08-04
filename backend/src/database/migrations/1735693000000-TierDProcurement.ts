import { MigrationInterface, QueryRunner } from 'typeorm';

/** Tier D: customer-linked vendors and procurement documents. */
export class TierDProcurement1735693000000 implements MigrationInterface {
  name = 'TierDProcurement1735693000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasCustomerId = await queryRunner.hasColumn(
      'suppliers',
      'customer_id',
    );
    if (!hasCustomerId) {
      await queryRunner.query(`
        ALTER TABLE suppliers
        ADD COLUMN customer_id uuid UNIQUE,
        ADD CONSTRAINT fk_suppliers_customer
          FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
      `);
    }

    const hasDocs = await queryRunner.hasTable('procurement_documents');
    if (!hasDocs) {
      await queryRunner.connection.synchronize();
    }

    // Extend purchase_orders status enum with PAID if missing
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE purchase_orders_status_enum ADD VALUE IF NOT EXISTS 'PAID';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `).catch(() => undefined);
  }

  public async down(): Promise<void> {
    // Non-destructive rollback not supported.
  }
}
