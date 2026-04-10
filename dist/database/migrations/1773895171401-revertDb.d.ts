import { MigrationInterface, QueryRunner } from "typeorm";
export declare class RevertDb1773895171401 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
