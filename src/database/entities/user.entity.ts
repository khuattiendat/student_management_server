import { BaseEntity } from '@/common/base/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true, nullable: false, length: 255, name: 'user_name' })
  userName: string;
  @Column({
    nullable: false,
    select: false,
  })
  password: string;
  @Column({
    nullable: false,
    length: 255,
    name: 'name',
  })
  name: string;
}
