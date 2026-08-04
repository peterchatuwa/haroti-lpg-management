import { MigrationInterface, QueryRunner } from 'typeorm';

/** Tier B: tanks, cylinder movements, mobile-money lines, loss cases. */
export class TierBPilot1735690000000 implements MigrationInterface {
  name = 'TierBPilot1735690000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTanks = await queryRunner.hasTable('tanks');
    if (!hasTanks) {
      await queryRunner.connection.synchronize();
    }
  }

  public async down(): Promise<void> {
    // Non-destructive rollback not supported for additive Tier B schema.
  }
}
