import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/base/base.entity';
import { Enrollment } from './enrollment.entity';

export enum PackageType {
  COMBO = 'combo',
  COURSE = 'course',
}

@Entity('packages')
export class Package extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ name: 'total_sessions', type: 'int', nullable: false })
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
  })
  type: PackageType;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.package)
  enrollments: Enrollment[];
}
