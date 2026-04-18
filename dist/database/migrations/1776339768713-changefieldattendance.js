"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Changefieldattendance1776339768713 = void 0;
class Changefieldattendance1776339768713 {
    name = 'Changefieldattendance1776339768713';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`attendances\` ADD \`note\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`attendances\` CHANGE \`status\` \`status\` enum ('present', 'late', 'unexcused_absent', 'late_cancel_absent', 'excused_absent', 'unjustified_leave') NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`attendances\` CHANGE \`status\` \`status\` enum ('present', 'late', 'excused_absent', 'unexcused_absent', 'late_cancel_absent') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`attendances\` DROP COLUMN \`note\``);
    }
}
exports.Changefieldattendance1776339768713 = Changefieldattendance1776339768713;
//# sourceMappingURL=1776339768713-changefieldattendance.js.map