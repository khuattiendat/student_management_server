import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDb1773585480618 implements MigrationInterface {
    name = 'UpdateDb1773585480618'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`branch_id\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`branch_id\` int NULL`);
    }

}
