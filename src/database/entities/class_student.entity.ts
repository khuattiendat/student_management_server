import { BaseEntity } from '@/common/base/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Class } from './class.entity';
import { Student } from './student.entity';

@Entity('class_students')
@Unique(['classId', 'studentId'])
export class ClassStudent extends BaseEntity {
  @Column({ name: 'class_id', type: 'int', nullable: false })
  classId: number;

  @Column({ name: 'student_id', type: 'int', nullable: false })
  studentId: number;

  @ManyToOne(() => Class, (classEntity) => classEntity.classStudents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  classEntity: Class;

  @ManyToOne(() => Student, (student) => student.classStudents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: Student;
}
