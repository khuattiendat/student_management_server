import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Session } from './session.entity';
import { Student } from './student.entity';
import { BaseEntity } from '@/common/base/base.entity';

export enum AttendanceStatus {
  PRESENT = 'present', // Có mặt
  LATE = 'late', // Đi muộn
  UNEXCUSED_ABSENT = 'unexcused_absent', // Nghỉ không phép
  LATE_CANCEL_ABSENT = 'late_cancel_absent', // Báo nghỉ sát giờ
  EXCUSED_ABSENT = 'excused_absent', // Nghỉ có phép chính đáng
  UNJUSTIFIED_LEAVE = 'unjustified_leave', //Nghỉ có phép nhưng không chính đáng
}

@Entity('attendances')
@Index(['sessionId', 'studentId'], { unique: true })
// điểm danh của 1 học sinh trong 1 buổi học
export class Attendance extends BaseEntity {
  @Column({ name: 'session_id', type: 'int', nullable: false })
  sessionId!: number;

  @Column({ name: 'student_id', type: 'int', nullable: false })
  studentId!: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: AttendanceStatus,
    nullable: false,
  })
  status!: AttendanceStatus;

  @Column({ name: 'rate', type: 'int', nullable: true })
  rate?: number | null;

  @Column({ name: 'note', type: 'text', nullable: true })
  note?: string | null;

  @ManyToOne(() => Session, (session) => session.attendances, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session!: Session;

  @ManyToOne(() => Student, (student) => student.attendances, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student!: Student;
}
