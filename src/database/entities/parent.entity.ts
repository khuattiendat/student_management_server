import { Column, Entity, ManyToMany } from 'typeorm';
import { BaseEntity } from '@/common/base/base.entity';
import { Student } from './student.entity';

@Entity('parents')
export class Parent extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ name: 'phone', type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  email: string;
  @ManyToMany(() => Student, (student) => student.parents)
  students: Student[];
}
