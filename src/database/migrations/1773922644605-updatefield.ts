import { MigrationInterface, QueryRunner } from "typeorm";

export class Updatefield1773922644605 implements MigrationInterface {
    name = 'Updatefield1773922644605'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`classes\` DROP FOREIGN KEY \`FK_861138a247c05edd3db91810d56\``);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`package_id\` \`package_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`type\` \`type\` enum ('certificate', 'general', 'school_subject') NOT NULL DEFAULT 'certificate'`);
        await queryRunner.query(`ALTER TABLE \`classes\` ADD CONSTRAINT \`FK_861138a247c05edd3db91810d56\` FOREIGN KEY (\`package_id\`) REFERENCES \`packages\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`classes\` DROP FOREIGN KEY \`FK_861138a247c05edd3db91810d56\``);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`type\` \`type\` enum ('certificate', 'general') NOT NULL DEFAULT 'certificate'`);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`package_id\` \`package_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`classes\` ADD CONSTRAINT \`FK_861138a247c05edd3db91810d56\` FOREIGN KEY (\`package_id\`) REFERENCES \`packages\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
