"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Addfield1773825113754 = void 0;
class Addfield1773825113754 {
    name = 'Addfield1773825113754';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`classes\` ADD \`weekdays\` varchar(255) NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`classes\` DROP COLUMN \`weekdays\``);
    }
}
exports.Addfield1773825113754 = Addfield1773825113754;
//# sourceMappingURL=1773825113754-addfield.js.map