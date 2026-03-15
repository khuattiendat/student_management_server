import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDb1773584959940 implements MigrationInterface {
    name = 'UpdateDb1773584959940'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`FK_5a58f726a41264c8b3e86d4a1de\` ON \`users\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX \`FK_5a58f726a41264c8b3e86d4a1de\` ON \`users\` (\`branch_id\`)`);
    }

}
