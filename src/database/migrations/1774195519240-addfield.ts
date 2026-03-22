import { MigrationInterface, QueryRunner } from "typeorm";

export class Addfield1774195519240 implements MigrationInterface {
    name = 'Addfield1774195519240'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`classes\` ADD \`schedule_by_weekday\` json NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`classes\` DROP COLUMN \`schedule_by_weekday\``);
    }

}
