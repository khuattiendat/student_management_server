import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Attendance } from './attendance.entity';
import { Class } from './class.entity';
import { BaseEntity } from '@/common/base/base.entity';

@Entity('sessions')
export class Session extends BaseEntity {
  @Column({ name: 'class_id', type: 'int', nullable: false })
  classId: number;

  @Column({ name: 'session_date', type: 'date', nullable: false })
  sessionDate: Date;

  @Column({ name: 'start_time', type: 'time', nullable: false })
  startTime: string;

  @Column({ name: 'end_time', type: 'time', nullable: false })
  endTime: string;

  @ManyToOne(() => Class, (classEntity) => classEntity.sessions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'class_id' })
  classEntity: Class;

  @OneToMany(() => Attendance, (attendance) => attendance.session)
  attendances: Attendance[];
}
