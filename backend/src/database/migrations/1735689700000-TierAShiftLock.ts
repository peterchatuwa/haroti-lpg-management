import { MigrationInterface, QueryRunner } from 'typeorm';

export class TierAShiftLock1735689700000 implements MigrationInterface {
  name = 'TierAShiftLock1735689700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasShifts = await queryRunner.hasTable('shifts');
    if (!hasShifts) return;

    const hasLockedAt = await queryRunner.hasColumn('shifts', 'locked_at');
    if (!hasLockedAt) {
      await queryRunner.query(
        `ALTER TABLE "shifts" ADD COLUMN "locked_at" TIMESTAMPTZ`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasLockedAt = await queryRunner.hasColumn('shifts', 'locked_at');
    if (hasLockedAt) {
      await queryRunner.query(`ALTER TABLE "shifts" DROP COLUMN "locked_at"`);
    }
  }
}
