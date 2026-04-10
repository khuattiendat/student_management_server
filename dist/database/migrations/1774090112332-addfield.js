"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Addfield1774090112332 = void 0;
class Addfield1774090112332 {
    name = 'Addfield1774090112332';
    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX \`FK_861138a247c05edd3db91810d56\` ON \`classes\``);
        await queryRunner.query(`ALTER TABLE \`enrollments\` ADD \`remaining_sessions\` int NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`enrollments\` DROP COLUMN \`remaining_sessions\``);
        await queryRunner.query(`CREATE INDEX \`FK_861138a247c05edd3db91810d56\` ON \`classes\` (\`package_id\`)`);
    }
}
exports.Addfield1774090112332 = Addfield1774090112332;
//# sourceMappingURL=1774090112332-addfield.js.map