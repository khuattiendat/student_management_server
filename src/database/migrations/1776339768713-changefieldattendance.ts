import { MigrationInterface, QueryRunner } from "typeorm";

export class Changefieldattendance1776339768713 implements MigrationInterface {
    name = 'Changefieldattendance1776339768713'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`attendances\` ADD \`note\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`attendances\` CHANGE \`status\` \`status\` enum ('present', 'late', 'unexcused_absent', 'late_cancel_absent', 'excused_absent', 'unjustified_leave') NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`attendances\` CHANGE \`status\` \`status\` enum ('present', 'late', 'excused_absent', 'unexcused_absent', 'late_cancel_absent') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`attendances\` DROP COLUMN \`note\``);
    }

}
