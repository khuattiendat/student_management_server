"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Addfieldclass1774282027439 = void 0;
class Addfieldclass1774282027439 {
    name = 'Addfieldclass1774282027439';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`classes\` ADD \`room_name\` varchar(255) NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`classes\` DROP COLUMN \`room_name\``);
    }
}
exports.Addfieldclass1774282027439 = Addfieldclass1774282027439;
//# sourceMappingURL=1774282027439-addfieldclass.js.map