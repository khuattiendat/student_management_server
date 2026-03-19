import { MigrationInterface, QueryRunner } from "typeorm";

export class RevertDb1773895171401 implements MigrationInterface {
    name = 'RevertDb1773895171401'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`packages\` DROP COLUMN \`age_group\``);
        await queryRunner.query(`ALTER TABLE \`packages\` DROP COLUMN \`catalog_mode\``);
        await queryRunner.query(`ALTER TABLE \`packages\` DROP COLUMN \`code\``);
        await queryRunner.query(`ALTER TABLE \`packages\` DROP COLUMN \`combo_months\``);
        await queryRunner.query(`ALTER TABLE \`packages\` DROP COLUMN \`is_active\``);
        await queryRunner.query(`ALTER TABLE \`packages\` DROP COLUMN \`language\``);
        await queryRunner.query(`ALTER TABLE \`packages\` DROP COLUMN \`program\``);
        await queryRunner.query(`ALTER TABLE \`packages\` DROP COLUMN \`selection_limit\``);
        await queryRunner.query(`ALTER TABLE \`packages\` DROP COLUMN \`sub_program\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`packages\` ADD \`sub_program\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`packages\` ADD \`selection_limit\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`packages\` ADD \`program\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`packages\` ADD \`language\` enum ('english', 'chinese') NULL`);
        await queryRunner.query(`ALTER TABLE \`packages\` ADD \`is_active\` tinyint NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE \`packages\` ADD \`combo_months\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`packages\` ADD \`code\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`packages\` ADD \`catalog_mode\` enum ('fixed', 'combo_select') NOT NULL DEFAULT 'fixed'`);
        await queryRunner.query(`ALTER TABLE \`packages\` ADD \`age_group\` varchar(100) NULL`);
    }

}
