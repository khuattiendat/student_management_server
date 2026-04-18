"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Updateenum1776344098051 = void 0;
class Updateenum1776344098051 {
    name = 'Updateenum1776344098051';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('admin', 'teacher', 'receptionist') NOT NULL DEFAULT 'teacher'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('admin', 'teacher') NOT NULL DEFAULT 'teacher'`);
    }
}
exports.Updateenum1776344098051 = Updateenum1776344098051;
//# sourceMappingURL=1776344098051-updateenum.js.map