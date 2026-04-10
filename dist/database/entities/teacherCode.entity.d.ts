import { BaseEntity } from '@/common/base/base.entity';
import { User } from './user.entity';
export declare class TeacherCode extends BaseEntity {
    code: string;
    expiresAt: Date;
    isUsed: boolean;
    teacherId: number | null;
    teacher: User;
}
