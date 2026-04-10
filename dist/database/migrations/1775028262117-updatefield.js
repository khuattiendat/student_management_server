"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Updatefield1775028262117 = void 0;
class Updatefield1775028262117 {
    name = 'Updatefield1775028262117';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`attendances\` CHANGE \`status\` \`status\` enum ('present', 'late', 'excused_absent', 'unexcused_absent', 'late_cancel_absent') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`teacher_code\` ADD UNIQUE INDEX \`IDX_2a0056fd89c8a720d5bce1b099\` (\`code\`)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`teacher_code\` DROP INDEX \`IDX_2a0056fd89c8a720d5bce1b099\``);
        await queryRunner.query(`ALTER TABLE \`attendances\` CHANGE \`status\` \`status\` enum ('present', 'absent', 'late') NOT NULL`);
    }
}
exports.Updatefield1775028262117 = Updatefield1775028262117;
//# sourceMappingURL=1775028262117-updatefield.js.map