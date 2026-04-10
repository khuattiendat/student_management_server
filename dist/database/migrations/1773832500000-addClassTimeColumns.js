"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddClassTimeColumns1773832500000 = void 0;
class AddClassTimeColumns1773832500000 {
    name = 'AddClassTimeColumns1773832500000';
    async up(queryRunner) {
        await queryRunner.query('ALTER TABLE `classes` ADD `start_time` time NULL, ADD `end_time` time NULL');
    }
    async down(queryRunner) {
        await queryRunner.query('ALTER TABLE `classes` DROP COLUMN `end_time`, DROP COLUMN `start_time`');
    }
}
exports.AddClassTimeColumns1773832500000 = AddClassTimeColumns1773832500000;
//# sourceMappingURL=1773832500000-addClassTimeColumns.js.map