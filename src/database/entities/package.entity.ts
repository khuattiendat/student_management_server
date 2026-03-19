import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/base/base.entity';
import { Enrollment } from './enrollment.entity';
import { Class } from './class.entity';

export enum PackageType {
  CERTIFICATE = 'certificate', // Lớp học có chứng chỉ (tính theo số lượng buổi học)
  GENERAL = 'general', // Lớp học phổ  thông (tính theo thời gian)
}

@Entity('packages')
export class Package extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ name: 'total_sessions', type: 'int', nullable: true })
  totalSessions: number;

  @Column({
    name: 'price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  price: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: PackageType,
    nullable: false,
    default: PackageType.CERTIFICATE,
  })
  type: PackageType;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.package)
  enrollments: Enrollment[];

  @OneToMany(() => Class, (classEntity) => classEntity.package)
  classes: Class[];
}
