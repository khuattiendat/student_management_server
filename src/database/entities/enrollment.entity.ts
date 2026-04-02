import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/base/base.entity';
import { Student } from './student.entity';
import { Package } from './package.entity';

@Entity('enrollments')
export class Enrollment extends BaseEntity {
  @Column({ name: 'student_id', type: 'int', nullable: false })
  studentId: number;

  @Column({ name: 'package_id', type: 'int', nullable: false })
  packageId: number;

  @Column({ name: 'remaining_sessions', type: 'int', nullable: false })
  remainingSessions: number;

  @Column({
    name: 'is_paid',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  isPaid: boolean; // đã thanh toán hay chưa

  @ManyToOne(() => Student, (student) => student.enrollments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => Package, (pack) => pack.enrollments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'package_id' })
  package: Package;
}
