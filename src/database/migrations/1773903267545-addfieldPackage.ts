import { MigrationInterface, QueryRunner } from "typeorm";

export class AddfieldPackage1773903267545 implements MigrationInterface {
    name = 'AddfieldPackage1773903267545'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`packages\` ADD \`info\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`packages\` CHANGE \`type\` \`type\` enum ('certificate', 'general', 'school_subject') NOT NULL DEFAULT 'certificate'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`packages\` CHANGE \`type\` \`type\` enum ('certificate', 'general') NOT NULL DEFAULT 'certificate'`);
        await queryRunner.query(`ALTER TABLE \`packages\` DROP COLUMN \`info\``);
    }

}
