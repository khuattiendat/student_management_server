"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDB1773650712837 = void 0;
class UpdateDB1773650712837 {
    name = 'UpdateDB1773650712837';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`packages\` CHANGE \`total_sessions\` \`total_sessions\` int NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`packages\` CHANGE \`total_sessions\` \`total_sessions\` int NOT NULL`);
    }
}
exports.UpdateDB1773650712837 = UpdateDB1773650712837;
//# sourceMappingURL=1773650712837-updateDB.js.map