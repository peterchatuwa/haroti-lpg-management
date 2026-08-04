import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline for databases created with synchronize:true before Tier A.
 * Fresh installs materialise the entity schema once when core tables are absent.
 */
export class BaselineSchema1735689600000 implements MigrationInterface {
  name = 'BaselineSchema1735689600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasStations = await queryRunner.hasTable('stations');
    if (!hasStations) {
      await queryRunner.connection.synchronize();
    }
  }

  public async down(): Promise<void> {
    // Destructive rollback is not supported for the baseline schema.
  }
}
