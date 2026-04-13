import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateField1776070622245 implements MigrationInterface {
    name = 'UpdateField1776070622245'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`birthday\``);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`birthday\` date NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`birthday\``);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`birthday\` varchar(255) NULL`);
    }

}
