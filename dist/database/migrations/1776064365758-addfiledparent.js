"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Addfiledparent1776064365758 = void 0;
class Addfiledparent1776064365758 {
    name = 'Addfiledparent1776064365758';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`parents\` ADD \`zalo_name\` varchar(255) NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`parents\` DROP COLUMN \`zalo_name\``);
    }
}
exports.Addfiledparent1776064365758 = Addfiledparent1776064365758;
//# sourceMappingURL=1776064365758-addfiledparent.js.map