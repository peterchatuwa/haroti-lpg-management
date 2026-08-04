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
        ADD COLUMN customer_id uuid UNIQUE
      `);
      await queryRunner.query(`
        ALTER TABLE suppliers
        ADD CONSTRAINT fk_suppliers_customer
          FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
      `);
    }

    const hasDocs = await queryRunner.hasTable('procurement_documents');
    if (!hasDocs) {
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE procurement_documents_document_type_enum AS ENUM (
            'QUOTATION', 'PURCHASE_ORDER', 'INVOICE', 'RECEIPT'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `);
      await queryRunner.query(`
        CREATE TABLE procurement_documents (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          purchase_order_id uuid NOT NULL
            REFERENCES purchase_orders(id) ON DELETE CASCADE,
          document_type procurement_documents_document_type_enum NOT NULL,
          document_number varchar(40) NOT NULL UNIQUE,
          issued_at timestamptz NOT NULL,
          payload text NOT NULL,
          generated_by_id uuid REFERENCES users(id)
        )
      `);
    }

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE purchase_orders_status_enum ADD VALUE IF NOT EXISTS 'PAID';
      EXCEPTION
        WHEN duplicate_object THEN null;
        WHEN undefined_object THEN null;
      END $$;
    `);
  }

  public async down(): Promise<void> {
    // Non-destructive rollback not supported.
  }
}
