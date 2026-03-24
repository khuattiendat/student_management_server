import { MigrationInterface, QueryRunner } from "typeorm";

export class Addfieldclass1774282027439 implements MigrationInterface {
    name = 'Addfieldclass1774282027439'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`classes\` ADD \`room_name\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`classes\` DROP COLUMN \`room_name\``);
    }

}
