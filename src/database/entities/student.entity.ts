import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '@/common/base/base.entity';
import { Branch } from './branch.entity';
import { Enrollment } from './enrollment.entity';
import { Attendance } from './attendance.entity';
import { Parent } from './parent.entity';
import { ClassStudent } from './class_student.entity';
import { StudentRemainings } from './student_remainings.entity';

@Entity('students')
export class Student extends BaseEntity {
  @Column({
    name: 'branch_id',
    type: 'int',
    nullable: true,
  })
  branchId: number | null;

  @Column({
    nullable: false,
    length: 255,
    name: 'name',
  })
  name: string;

  @Column({
    nullable: true,
    name: 'birthday',
    type: 'date',
  })
  birthday: Date;

  @Column({
    nullable: true,
    name: 'phone',
    length: 20,
  })
  phone: string;

  @ManyToOne(() => Branch, (branch) => branch.students, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch | null;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];

  @OneToMany(() => Attendance, (attendance) => attendance.student)
  attendances: Attendance[];
  @ManyToMany(() => Parent, (parent) => parent.students, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'student_parents',
    joinColumn: {
      name: 'student_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'parent_id',
      referencedColumnName: 'id',
    },
  })
  parents: Parent[];

  @OneToMany(() => ClassStudent, (classStudent) => classStudent.student)
  classStudents: ClassStudent[];

  @OneToMany(() => StudentRemainings, (remainings) => remainings.student)
  remainings: StudentRemainings[];
}
