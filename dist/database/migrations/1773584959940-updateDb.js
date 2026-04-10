"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDb1773584959940 = void 0;
class UpdateDb1773584959940 {
    name = 'UpdateDb1773584959940';
    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX \`FK_5a58f726a41264c8b3e86d4a1de\` ON \`users\``);
    }
    async down(queryRunner) {
        await queryRunner.query(`CREATE INDEX \`FK_5a58f726a41264c8b3e86d4a1de\` ON \`users\` (\`branch_id\`)`);
    }
}
exports.UpdateDb1773584959940 = UpdateDb1773584959940;
//# sourceMappingURL=1773584959940-updateDb.js.map