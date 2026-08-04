import { MigrationInterface, QueryRunner } from 'typeorm';

export class Requisitions1735691000000 implements MigrationInterface {
  name = 'Requisitions1735691000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasReq = await queryRunner.hasTable('requisitions');
    if (!hasReq) {
      await queryRunner.connection.synchronize();
    }
  }

  public async down(): Promise<void> {
    // Additive schema — no destructive rollback.
  }
}
