import { BaseEntity } from '@/common/base/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Class } from './class.entity';
import { Package } from './package.entity';

@Entity('class_packages')
@Unique(['classId', 'packageId'])
export class ClassPackage extends BaseEntity {
  @Column({ name: 'package_id', type: 'int', nullable: false })
  packageId: number;

  @Column({ name: 'class_id', type: 'int', nullable: false })
  classId: number;

  @ManyToOne(() => Class, (classEntity) => classEntity.classPackages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  classEntity: Class;

  @ManyToOne(() => Package, (pac) => pac.classPackage, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'package_id' })
  package: Package;
}
