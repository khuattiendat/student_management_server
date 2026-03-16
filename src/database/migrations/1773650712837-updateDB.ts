import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDB1773650712837 implements MigrationInterface {
    name = 'UpdateDB1773650712837'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`packages\` CHANGE \`total_sessions\` \`total_sessions\` int NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`packages\` CHANGE \`total_sessions\` \`total_sessions\` int NOT NULL`);
    }

}
