import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatField1773912376104 implements MigrationInterface {
    name = 'UpdatField1773912376104'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`birthday\``);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`birthday\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`birthday\``);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`birthday\` date NULL`);
    }

}
