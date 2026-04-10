import { MigrationInterface, QueryRunner } from "typeorm";
export declare class UpdateDb1773584959940 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
