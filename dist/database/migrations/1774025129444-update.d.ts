import { MigrationInterface, QueryRunner } from "typeorm";
export declare class Update1774025129444 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
