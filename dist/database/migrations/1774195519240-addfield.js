"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Addfield1774195519240 = void 0;
class Addfield1774195519240 {
    name = 'Addfield1774195519240';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`classes\` ADD \`schedule_by_weekday\` json NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`classes\` DROP COLUMN \`schedule_by_weekday\``);
    }
}
exports.Addfield1774195519240 = Addfield1774195519240;
//# sourceMappingURL=1774195519240-addfield.js.map