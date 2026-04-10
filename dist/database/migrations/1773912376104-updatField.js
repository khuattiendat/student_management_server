"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatField1773912376104 = void 0;
class UpdatField1773912376104 {
    name = 'UpdatField1773912376104';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`birthday\``);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`birthday\` varchar(255) NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`birthday\``);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`birthday\` date NULL`);
    }
}
exports.UpdatField1773912376104 = UpdatField1773912376104;
//# sourceMappingURL=1773912376104-updatField.js.map