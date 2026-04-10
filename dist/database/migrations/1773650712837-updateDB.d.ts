import { MigrationInterface, QueryRunner } from "typeorm";
export declare class UpdateDB1773650712837 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
