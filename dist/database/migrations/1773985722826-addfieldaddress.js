"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Addfieldaddress1773985722826 = void 0;
class Addfieldaddress1773985722826 {
    name = 'Addfieldaddress1773985722826';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`address\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`type\` \`type\` enum ('certificate', 'general', 'school_subject') NOT NULL DEFAULT 'general'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`type\` \`type\` enum ('certificate', 'general', 'school_subject') NOT NULL DEFAULT 'certificate'`);
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`address\``);
    }
}
exports.Addfieldaddress1773985722826 = Addfieldaddress1773985722826;
//# sourceMappingURL=1773985722826-addfieldaddress.js.map