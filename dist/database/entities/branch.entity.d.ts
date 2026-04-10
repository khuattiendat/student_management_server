import { BaseEntity } from '@/common/base/base.entity';
import { User } from './user.entity';
import { Student } from './student.entity';
import { Class } from './class.entity';
export declare class Branch extends BaseEntity {
    name: string;
    address: string;
    phone: string;
    managedUsers: User[];
    students: Student[];
    classes: Class[];
}
