import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '@/common/base/base.entity';
import { Branch } from './branch.entity';
import { ClassStudent } from './class_student.entity';
import { Session } from './session.entity';
import { User } from './user.entity';

export enum ClassStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('classes')
export class Class extends BaseEntity {
  @Column({ name: 'branch_id', type: 'int', nullable: true })
  branchId: number | null;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ClassStatus,
    default: ClassStatus.ACTIVE,
  })
  status: ClassStatus;

  @ManyToOne(() => Branch, (branch) => branch.classes, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch | null;

  @OneToMany(() => ClassStudent, (classStudent) => classStudent.classEntity)
  classStudents: ClassStudent[];

  @OneToMany(() => Session, (session) => session.classEntity)
  sessions: Session[];
  @ManyToMany(() => User, (user) => user.classes)
  teachers: User[];
}
