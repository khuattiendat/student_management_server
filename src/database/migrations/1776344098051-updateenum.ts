import { MigrationInterface, QueryRunner } from "typeorm";

export class Updateenum1776344098051 implements MigrationInterface {
    name = 'Updateenum1776344098051'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('admin', 'teacher', 'receptionist') NOT NULL DEFAULT 'teacher'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('admin', 'teacher') NOT NULL DEFAULT 'teacher'`);
    }

}
