"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Addfieldstudent1774246626222 = void 0;
class Addfieldstudent1774246626222 {
    name = 'Addfieldstudent1774246626222';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_246426dfd001466a1d5e47322f4\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`branchId\``);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`deletedBy_branch_id\` int NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`deletedBy_branch_id\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`branchId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_246426dfd001466a1d5e47322f4\` FOREIGN KEY (\`branchId\`) REFERENCES \`branches\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
}
exports.Addfieldstudent1774246626222 = Addfieldstudent1774246626222;
//# sourceMappingURL=1774246626222-addfieldstudent.js.map