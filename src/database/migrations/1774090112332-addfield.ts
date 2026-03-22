import { MigrationInterface, QueryRunner } from "typeorm";

export class Addfield1774090112332 implements MigrationInterface {
    name = 'Addfield1774090112332'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`FK_861138a247c05edd3db91810d56\` ON \`classes\``);
        await queryRunner.query(`ALTER TABLE \`enrollments\` ADD \`remaining_sessions\` int NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`enrollments\` DROP COLUMN \`remaining_sessions\``);
        await queryRunner.query(`CREATE INDEX \`FK_861138a247c05edd3db91810d56\` ON \`classes\` (\`package_id\`)`);
    }

}
