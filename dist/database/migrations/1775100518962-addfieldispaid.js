"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Addfieldispaid1775100518962 = void 0;
class Addfieldispaid1775100518962 {
    name = 'Addfieldispaid1775100518962';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`enrollments\` ADD \`is_paid\` tinyint NOT NULL DEFAULT 0`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`enrollments\` DROP COLUMN \`is_paid\``);
    }
}
exports.Addfieldispaid1775100518962 = Addfieldispaid1775100518962;
//# sourceMappingURL=1775100518962-addfieldispaid.js.map