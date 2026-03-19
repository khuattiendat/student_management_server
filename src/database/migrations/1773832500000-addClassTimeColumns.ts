import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClassTimeColumns1773832500000 implements MigrationInterface {
  name = 'AddClassTimeColumns1773832500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `classes` ADD `start_time` time NULL, ADD `end_time` time NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `classes` DROP COLUMN `end_time`, DROP COLUMN `start_time`',
    );
  }
}
