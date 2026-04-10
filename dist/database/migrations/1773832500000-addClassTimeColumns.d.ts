import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddClassTimeColumns1773832500000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
