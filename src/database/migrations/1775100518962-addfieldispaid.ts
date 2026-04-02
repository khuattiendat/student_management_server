import { MigrationInterface, QueryRunner } from "typeorm";

export class Addfieldispaid1775100518962 implements MigrationInterface {
    name = 'Addfieldispaid1775100518962'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`enrollments\` ADD \`is_paid\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`enrollments\` DROP COLUMN \`is_paid\``);
    }

}
