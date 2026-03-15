import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/base/base.entity';
import { ClassStudent } from './class_student.entity';
import { Student } from './student.entity';
import { Package } from './package.entity';

@Entity('enrollments')
export class Enrollment extends BaseEntity {
  @Column({ name: 'student_id', type: 'int', nullable: false })
  studentId: number;

  @Column({ name: 'package_id', type: 'int', nullable: false })
  packageId: number;

  @Column({ name: 'total_sessions', type: 'int', nullable: false })
  totalSessions: number;

  @Column({ name: 'remaining_sessions', type: 'int', nullable: false })
  remainingSessions: number;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

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

  @OneToMany(() => ClassStudent, (classStudent) => classStudent.enrollment)
  classStudents: ClassStudent[];
}
