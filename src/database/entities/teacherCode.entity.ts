import { BaseEntity } from '@/common/base/base.entity';
import { Column, Entity, ManyToMany, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('teacher_code')
export class TeacherCode extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  code: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: false })
  expiresAt: Date;

  @Column({
    name: 'is_used',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  isUsed: boolean;

  @Column({ name: 'teacher_id', type: 'int', nullable: true })
  teacherId: number | null;

  @ManyToOne(() => User, (teacher) => teacher.code, {
    onDelete: 'CASCADE',
  })
  teacher: User;
}
