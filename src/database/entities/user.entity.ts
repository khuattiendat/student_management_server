import { BaseEntity } from '@/common/base/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Branch } from './branch.entity';
import { Class } from './class.entity';
import { TeacherCode } from './teacherCode.entity';
export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
}
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
@Entity('users')
export class User extends BaseEntity {
  @Column({
    nullable: false,
    length: 255,
    name: 'name',
  })
  name: string;

  @Column({
    nullable: true,
    length: 20,
    name: 'phone',
  })
  phone: string;

  @Column({ unique: true, nullable: false, length: 255, name: 'user_name' })
  userName: string;

  @Column({
    nullable: false,
    select: false,
    length: 255,
    name: 'password',
  })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.TEACHER,
    name: 'role',
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    name: 'status',
  })
  status: UserStatus;

  @ManyToMany(() => Branch, (branch) => branch.managedUsers)
  @JoinTable({
    name: 'user_branches',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'branch_id',
      referencedColumnName: 'id',
    },
  })
  branches: Branch[];

  @OneToMany(() => Class, (classEntity) => classEntity.teacher)
  classes: Class[];

  @OneToMany(() => TeacherCode, (code) => code.teacher)
  code: TeacherCode[];
}
