"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDb1773585480618 = void 0;
class UpdateDb1773585480618 {
    name = 'UpdateDb1773585480618';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`branch_id\``);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`branch_id\` int NULL`);
    }
}
exports.UpdateDb1773585480618 = UpdateDb1773585480618;
//# sourceMappingURL=1773585480618-updateDb.js.map