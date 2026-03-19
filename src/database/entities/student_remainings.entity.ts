import { BaseEntity } from '@/common/base/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Student } from './student.entity';

@Entity('student_remainings')
export class StudentRemainings extends BaseEntity {
  @Column({ name: 'student_id', type: 'int', nullable: false })
  studentId: number;
  @Column({ name: 'remaining_sessions', type: 'int', nullable: false })
  remainingSessions: number;

  @ManyToOne(() => Student, (student) => student.remainings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: Student;
}
