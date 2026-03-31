import { MigrationInterface, QueryRunner } from "typeorm";

export class Addfieldstudent1774514757982 implements MigrationInterface {
    name = 'Addfieldstudent1774514757982'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`cycle_start_date\` date NULL`);
        await queryRunner.query(`ALTER TABLE \`classes\` DROP FOREIGN KEY \`FK_0f9da22d0877345eb23b8299823\``);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`branch_id\` \`branch_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`classes\` ADD CONSTRAINT \`FK_0f9da22d0877345eb23b8299823\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`classes\` DROP FOREIGN KEY \`FK_0f9da22d0877345eb23b8299823\``);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`branch_id\` \`branch_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`classes\` ADD CONSTRAINT \`FK_0f9da22d0877345eb23b8299823\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`cycle_start_date\``);
    }

}
