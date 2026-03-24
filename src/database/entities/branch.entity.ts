import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/base/base.entity';
import { User } from './user.entity';
import { Student } from './student.entity';
import { Class } from './class.entity';

@Entity('branches')
export class Branch extends BaseEntity {
  @Column({
    nullable: false,
    length: 255,
    name: 'name',
  })
  name: string;

  @Column({
    nullable: true,
    length: 255,
    name: 'address',
  })
  address: string;

  @Column({
    nullable: true,
    length: 255,
    name: 'phone',
  })
  phone: string;

  @ManyToMany(() => User, (user) => user.branches)
  managedUsers: User[];

  @OneToMany(() => Student, (student) => student.branch)
  students: Student[];

  @OneToMany(() => Class, (classEntity) => classEntity.branch)
  classes: Class[];
}
