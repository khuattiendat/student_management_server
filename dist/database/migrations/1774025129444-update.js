"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Update1774025129444 = void 0;
class Update1774025129444 {
    name = 'Update1774025129444';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`classes\` DROP FOREIGN KEY \`FK_861138a247c05edd3db91810d56\``);
        await queryRunner.query(`ALTER TABLE \`classes\` DROP FOREIGN KEY \`FK_b34c92e413c4debb6e0f23fed46\``);
        await queryRunner.query(`CREATE TABLE \`class_packages\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`package_id\` int NOT NULL, \`class_id\` int NOT NULL, UNIQUE INDEX \`IDX_624ae35160a057d6ac81bbd23a\` (\`class_id\`, \`package_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`classes\` DROP FOREIGN KEY \`FK_0f9da22d0877345eb23b8299823\``);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`teacher_id\` \`teacher_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`branch_id\` \`branch_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`classes\` ADD CONSTRAINT \`FK_0f9da22d0877345eb23b8299823\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`classes\` ADD CONSTRAINT \`FK_b34c92e413c4debb6e0f23fed46\` FOREIGN KEY (\`teacher_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`class_packages\` ADD CONSTRAINT \`FK_b3afb987a6a87094518f1ad9cf7\` FOREIGN KEY (\`class_id\`) REFERENCES \`classes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`class_packages\` ADD CONSTRAINT \`FK_6e2e2245ecdcf96dac87fc300d4\` FOREIGN KEY (\`package_id\`) REFERENCES \`packages\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`class_packages\` DROP FOREIGN KEY \`FK_6e2e2245ecdcf96dac87fc300d4\``);
        await queryRunner.query(`ALTER TABLE \`class_packages\` DROP FOREIGN KEY \`FK_b3afb987a6a87094518f1ad9cf7\``);
        await queryRunner.query(`ALTER TABLE \`classes\` DROP FOREIGN KEY \`FK_b34c92e413c4debb6e0f23fed46\``);
        await queryRunner.query(`ALTER TABLE \`classes\` DROP FOREIGN KEY \`FK_0f9da22d0877345eb23b8299823\``);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`branch_id\` \`branch_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`classes\` CHANGE \`teacher_id\` \`teacher_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`classes\` ADD CONSTRAINT \`FK_0f9da22d0877345eb23b8299823\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`DROP INDEX \`IDX_624ae35160a057d6ac81bbd23a\` ON \`class_packages\``);
        await queryRunner.query(`DROP TABLE \`class_packages\``);
        await queryRunner.query(`ALTER TABLE \`classes\` ADD CONSTRAINT \`FK_b34c92e413c4debb6e0f23fed46\` FOREIGN KEY (\`teacher_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`classes\` ADD CONSTRAINT \`FK_861138a247c05edd3db91810d56\` FOREIGN KEY (\`package_id\`) REFERENCES \`packages\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
}
exports.Update1774025129444 = Update1774025129444;
//# sourceMappingURL=1774025129444-update.js.map