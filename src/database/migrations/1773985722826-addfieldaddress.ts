import { MigrationInterface, QueryRunner } from "typeorm";

export class Addfieldaddress1773985722826 implements MigrationInterface {
    name = 'Addfieldaddress1773985722826'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`address\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`type\` \`type\` enum ('certificate', 'general', 'school_subject') NOT NULL DEFAULT 'general'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`type\` \`type\` enum ('certificate', 'general', 'school_subject') NOT NULL DEFAULT 'certificate'`);
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`address\``);
    }

}
