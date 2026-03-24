import { MigrationInterface, QueryRunner } from "typeorm";

export class Addtable1774340028683 implements MigrationInterface {
    name = 'Addtable1774340028683'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`teacher_code\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`code\` varchar(255) NOT NULL, \`expires_at\` timestamp NOT NULL, \`is_used\` tinyint NOT NULL DEFAULT 0, \`teacher_id\` int NULL, \`teacherId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`teacher_code\` ADD CONSTRAINT \`FK_5728c980cc9bf1d7d6852ebb618\` FOREIGN KEY (\`teacherId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`teacher_code\` DROP FOREIGN KEY \`FK_5728c980cc9bf1d7d6852ebb618\``);
        await queryRunner.query(`DROP TABLE \`teacher_code\``);
    }

}
