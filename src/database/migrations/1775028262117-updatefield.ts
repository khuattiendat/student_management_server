import { MigrationInterface, QueryRunner } from "typeorm";

export class Updatefield1775028262117 implements MigrationInterface {
    name = 'Updatefield1775028262117'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`attendances\` CHANGE \`status\` \`status\` enum ('present', 'late', 'excused_absent', 'unexcused_absent', 'late_cancel_absent') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`teacher_code\` ADD UNIQUE INDEX \`IDX_2a0056fd89c8a720d5bce1b099\` (\`code\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`teacher_code\` DROP INDEX \`IDX_2a0056fd89c8a720d5bce1b099\``);
        await queryRunner.query(`ALTER TABLE \`attendances\` CHANGE \`status\` \`status\` enum ('present', 'absent', 'late') NOT NULL`);
    }

}
