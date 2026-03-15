import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Enrollment } from './enrollment.entity';
import { Student } from './student.entity';
import { Class } from './class.entity';
import { BaseEntity } from '@/common/base/base.entity';

@Entity('class_students')
export class ClassStudent extends BaseEntity {
  @Column({ name: 'class_id', type: 'int', nullable: false })
  classId: number;

  @Column({ name: 'student_id', type: 'int', nullable: false })
  studentId: number;

  @Column({ name: 'enrollment_id', type: 'int', nullable: false })
  enrollmentId: number;

  @ManyToOne(() => Class, (classEntity) => classEntity.classStudents, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  classEntity: Class;

  @ManyToOne(() => Student, (student) => student.classStudents, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.classStudents, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'enrollment_id' })
  enrollment: Enrollment;
}
