import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/base/base.entity';
import { Branch } from './branch.entity';
import { Session } from './session.entity';
import { User } from './user.entity';
import { Package } from './package.entity';
import { ClassStudent } from './class_student.entity';
import { ClassPackage } from './class_packages.entity';

export enum ClassStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed',
}
export enum ClassType {
  CERTIFICATE = 'certificate', // Lớp học có chứng chỉ (tính theo số lượng buổi học)
  GENERAL = 'general', // Lớp học phổ thông (tính theo thời gian)
  SCHOOL_SUBJECT = 'school_subject', // Lớp học theo môn học (tính theo thời gian)
}
// weekdays: 0 - Sunday, 1 - Monday, ..., 6 - Saturday
@Entity('classes')
export class Class extends BaseEntity {
  @Column({ name: 'branch_id', type: 'int' })
  branchId: number;

  @Column({ name: 'teacher_id', type: 'int', nullable: true })
  teacherId?: number;

  @Column({ name: 'package_id', type: 'int', nullable: true })
  packageId: number | null;

  @Column({
    name: 'type',
    type: 'enum',
    enum: ClassType,
    default: ClassType.GENERAL,
  })
  type: ClassType;
  @Column({ name: 'name', type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({
    name: 'room_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  roomName: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ClassStatus,
    default: ClassStatus.ACTIVE,
  })
  status: ClassStatus;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime: string | null;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime: string | null;

  @Column({
    name: 'weekdays',
    type: 'varchar',
    transformer: {
      to: (value: number[]) => value.join(','),
      from: (value: string) =>
        value?.split(',').map((day) => parseInt(day, 10)),
    },
  })
  weekdays: number[];

  @Column({
    name: 'schedule_by_weekday',
    type: 'json',
    nullable: true,
  })
  scheduleByWeekday: Record<
    string,
    { startTime: string; endTime: string }
  > | null;

  @ManyToOne(() => Branch, (branch) => branch.classes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => User, (user) => user.classes, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User | null;

  @OneToMany(() => ClassStudent, (classStudent) => classStudent.classEntity)
  classStudents: ClassStudent[];

  @OneToMany(() => ClassPackage, (classPackage) => classPackage.classEntity)
  classPackages: ClassPackage[];

  @OneToMany(() => Session, (session) => session.classEntity)
  sessions: Session[];
}
