"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Addfiel1773987639706 = void 0;
class Addfiel1773987639706 {
    name = 'Addfiel1773987639706';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`address\``);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`address_detail\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`province_code\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`ward_code\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`province_name\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`ward_name\` varchar(255) NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`ward_name\``);
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`province_name\``);
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`ward_code\``);
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`province_code\``);
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`address_detail\``);
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`address\` varchar(255) NULL`);
    }
}
exports.Addfiel1773987639706 = Addfiel1773987639706;
//# sourceMappingURL=1773987639706-addfiel.js.map