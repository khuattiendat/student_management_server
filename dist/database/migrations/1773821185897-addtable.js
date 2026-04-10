"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Addtable1773821185897 = void 0;
class Addtable1773821185897 {
    name = 'Addtable1773821185897';
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE \`student_remainings\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`student_id\` int NOT NULL, \`remaining_sessions\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`student_remainings\` ADD CONSTRAINT \`FK_11053ab755d75a2fc75e0af7367\` FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`student_remainings\` DROP FOREIGN KEY \`FK_11053ab755d75a2fc75e0af7367\``);
        await queryRunner.query(`DROP TABLE \`student_remainings\``);
    }
}
exports.Addtable1773821185897 = Addtable1773821185897;
//# sourceMappingURL=1773821185897-addtable.js.map