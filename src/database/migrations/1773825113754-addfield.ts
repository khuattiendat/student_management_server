import { MigrationInterface, QueryRunner } from "typeorm";

export class Addfield1773825113754 implements MigrationInterface {
    name = 'Addfield1773825113754'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`classes\` ADD \`weekdays\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`classes\` DROP COLUMN \`weekdays\``);
    }

}
