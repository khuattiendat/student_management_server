"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeClassPackageOptional1774016000000 = void 0;
const typeorm_1 = require("typeorm");
class MakeClassPackageOptional1774016000000 {
    name = 'MakeClassPackageOptional1774016000000';
    async up(queryRunner) {
        const classesTable = await queryRunner.getTable('classes');
        if (!classesTable) {
            return;
        }
        const packageIdColumn = classesTable.findColumnByName('package_id');
        if (!packageIdColumn) {
            return;
        }
        const packageForeignKey = classesTable.foreignKeys.find((foreignKey) => foreignKey.columnNames.includes('package_id'));
        if (packageForeignKey) {
            await queryRunner.dropForeignKey('classes', packageForeignKey);
        }
        await queryRunner.changeColumn('classes', 'package_id', new typeorm_1.TableColumn({
            name: 'package_id',
            type: 'int',
            isNullable: true,
        }));
        await queryRunner.createForeignKey('classes', new typeorm_1.TableForeignKey({
            columnNames: ['package_id'],
            referencedTableName: 'packages',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
        }));
    }
    async down(queryRunner) {
        const classesTable = await queryRunner.getTable('classes');
        if (!classesTable) {
            return;
        }
        const packageIdColumn = classesTable.findColumnByName('package_id');
        if (!packageIdColumn) {
            return;
        }
        const packageForeignKey = classesTable.foreignKeys.find((foreignKey) => foreignKey.columnNames.includes('package_id'));
        if (packageForeignKey) {
            await queryRunner.dropForeignKey('classes', packageForeignKey);
        }
        await queryRunner.changeColumn('classes', 'package_id', new typeorm_1.TableColumn({
            name: 'package_id',
            type: 'int',
            isNullable: false,
        }));
        await queryRunner.createForeignKey('classes', new typeorm_1.TableForeignKey({
            columnNames: ['package_id'],
            referencedTableName: 'packages',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
        }));
    }
}
exports.MakeClassPackageOptional1774016000000 = MakeClassPackageOptional1774016000000;
//# sourceMappingURL=1774016000000-makeClassPackageOptional.js.map