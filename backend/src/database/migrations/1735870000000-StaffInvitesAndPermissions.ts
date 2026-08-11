import { MigrationInterface, QueryRunner } from 'typeorm';

export class StaffInvitesAndPermissions1735870000000 implements MigrationInterface {
  name = 'StaffInvitesAndPermissions1735870000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        key varchar(80) PRIMARY KEY,
        description varchar(200) NOT NULL,
        category varchar(40) NOT NULL
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role varchar(40) NOT NULL,
        permission_key varchar(80) NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
        PRIMARY KEY (role, permission_key)
      );
    `);

    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS invite_token_hash varchar(255),
        ADD COLUMN IF NOT EXISTS invite_expires_at timestamptz,
        ADD COLUMN IF NOT EXISTS must_set_password boolean NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS must_set_password,
        DROP COLUMN IF EXISTS invite_expires_at,
        DROP COLUMN IF EXISTS invite_token_hash;
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS role_permissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS permissions`);
  }
}
