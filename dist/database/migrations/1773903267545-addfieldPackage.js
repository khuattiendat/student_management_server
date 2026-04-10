"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddfieldPackage1773903267545 = void 0;
class AddfieldPackage1773903267545 {
    name = 'AddfieldPackage1773903267545';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`packages\` ADD \`info\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`packages\` CHANGE \`type\` \`type\` enum ('certificate', 'general', 'school_subject') NOT NULL DEFAULT 'certificate'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`packages\` CHANGE \`type\` \`type\` enum ('certificate', 'general') NOT NULL DEFAULT 'certificate'`);
        await queryRunner.query(`ALTER TABLE \`packages\` DROP COLUMN \`info\``);
    }
}
exports.AddfieldPackage1773903267545 = AddfieldPackage1773903267545;
//# sourceMappingURL=1773903267545-addfieldPackage.js.map