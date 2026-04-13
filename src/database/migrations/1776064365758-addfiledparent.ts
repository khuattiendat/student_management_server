import { MigrationInterface, QueryRunner } from "typeorm";

export class Addfiledparent1776064365758 implements MigrationInterface {
    name = 'Addfiledparent1776064365758'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`parents\` ADD \`zalo_name\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`parents\` DROP COLUMN \`zalo_name\``);
    }

}
