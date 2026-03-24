import { MigrationInterface, QueryRunner } from "typeorm";

export class Addfieldstudent1774246626222 implements MigrationInterface {
    name = 'Addfieldstudent1774246626222'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_246426dfd001466a1d5e47322f4\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`branchId\``);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`deletedBy_branch_id\` int NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`deletedBy_branch_id\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`branchId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_246426dfd001466a1d5e47322f4\` FOREIGN KEY (\`branchId\`) REFERENCES \`branches\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
