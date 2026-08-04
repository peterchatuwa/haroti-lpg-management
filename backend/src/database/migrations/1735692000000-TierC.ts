import { MigrationInterface, QueryRunner } from 'typeorm';

/** Tier C: weighted avg tank costing, customer payments. */
export class TierC1735692000000 implements MigrationInterface {
  name = 'TierC1735692000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasWac = await queryRunner.hasColumn(
      'stations',
      'weighted_avg_cost_per_kg',
    );
    if (!hasWac) {
      await queryRunner.query(`
        ALTER TABLE stations
        ADD COLUMN weighted_avg_cost_per_kg decimal(12,2) NOT NULL DEFAULT 1200
      `);
    }

    const hasPayments = await queryRunner.hasTable('customer_payments');
    if (!hasPayments) {
      await queryRunner.connection.synchronize();
    }
  }

  public async down(): Promise<void> {
    // Non-destructive rollback not supported for additive Tier C schema.
  }
}
