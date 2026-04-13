"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateField1776070622245 = void 0;
class UpdateField1776070622245 {
    name = 'UpdateField1776070622245';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`birthday\``);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`birthday\` date NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`birthday\``);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`birthday\` varchar(255) NULL`);
    }
}
exports.UpdateField1776070622245 = UpdateField1776070622245;
//# sourceMappingURL=1776070622245-updateField.js.map