"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Updatefield1773922644605 = void 0;
class Updatefield1773922644605 {
    name = 'Updatefield1773922644605';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`classes\` DROP FOREIGN KEY \`FK_861138a247c05edd3db91810d56\``);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`package_id\` \`package_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`type\` \`type\` enum ('certificate', 'general', 'school_subject') NOT NULL DEFAULT 'certificate'`);
        await queryRunner.query(`ALTER TABLE \`classes\` ADD CONSTRAINT \`FK_861138a247c05edd3db91810d56\` FOREIGN KEY (\`package_id\`) REFERENCES \`packages\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`classes\` DROP FOREIGN KEY \`FK_861138a247c05edd3db91810d56\``);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`type\` \`type\` enum ('certificate', 'general') NOT NULL DEFAULT 'certificate'`);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`package_id\` \`package_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`classes\` ADD CONSTRAINT \`FK_861138a247c05edd3db91810d56\` FOREIGN KEY (\`package_id\`) REFERENCES \`packages\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
}
exports.Updatefield1773922644605 = Updatefield1773922644605;
//# sourceMappingURL=1773922644605-updatefield.js.map