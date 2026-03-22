import { MigrationInterface, QueryRunner } from "typeorm";

export class Addfiel1773987639706 implements MigrationInterface {
    name = 'Addfiel1773987639706'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`address\``);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`address_detail\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`province_code\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`ward_code\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`province_name\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`ward_name\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`ward_name\``);
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`province_name\``);
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`ward_code\``);
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`province_code\``);
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`address_detail\``);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`address\` varchar(255) NULL`);
    }

}
