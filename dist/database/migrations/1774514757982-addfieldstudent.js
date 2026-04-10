"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Addfieldstudent1774514757982 = void 0;
class Addfieldstudent1774514757982 {
    name = 'Addfieldstudent1774514757982';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`students\` ADD \`cycle_start_date\` date NULL`);
        await queryRunner.query(`ALTER TABLE \`classes\` DROP FOREIGN KEY \`FK_0f9da22d0877345eb23b8299823\``);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`branch_id\` \`branch_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`classes\` ADD CONSTRAINT \`FK_0f9da22d0877345eb23b8299823\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`classes\` DROP FOREIGN KEY \`FK_0f9da22d0877345eb23b8299823\``);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`branch_id\` \`branch_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`classes\` ADD CONSTRAINT \`FK_0f9da22d0877345eb23b8299823\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`students\` DROP COLUMN \`cycle_start_date\``);
    }
}
exports.Addfieldstudent1774514757982 = Addfieldstudent1774514757982;
//# sourceMappingURL=1774514757982-addfieldstudent.js.map