import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class MakeClassPackageOptional1774016000000 implements MigrationInterface {
  name = 'MakeClassPackageOptional1774016000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const classesTable = await queryRunner.getTable('classes');
    if (!classesTable) {
      return;
    }

    const packageIdColumn = classesTable.findColumnByName('package_id');
    if (!packageIdColumn) {
      return;
    }

    const packageForeignKey = classesTable.foreignKeys.find((foreignKey) =>
      foreignKey.columnNames.includes('package_id'),
    );

    if (packageForeignKey) {
      await queryRunner.dropForeignKey('classes', packageForeignKey);
    }

    await queryRunner.changeColumn(
      'classes',
      'package_id',
      new TableColumn({
        name: 'package_id',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'classes',
      new TableForeignKey({
        columnNames: ['package_id'],
        referencedTableName: 'packages',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const classesTable = await queryRunner.getTable('classes');
    if (!classesTable) {
      return;
    }

    const packageIdColumn = classesTable.findColumnByName('package_id');
    if (!packageIdColumn) {
      return;
    }

    const packageForeignKey = classesTable.foreignKeys.find((foreignKey) =>
      foreignKey.columnNames.includes('package_id'),
    );

    if (packageForeignKey) {
      await queryRunner.dropForeignKey('classes', packageForeignKey);
    }

    await queryRunner.changeColumn(
      'classes',
      'package_id',
      new TableColumn({
        name: 'package_id',
        type: 'int',
        isNullable: false,
      }),
    );

    await queryRunner.createForeignKey(
      'classes',
      new TableForeignKey({
        columnNames: ['package_id'],
        referencedTableName: 'packages',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }
}
