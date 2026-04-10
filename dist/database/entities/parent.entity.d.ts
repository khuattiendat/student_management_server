import { BaseEntity } from '@/common/base/base.entity';
import { Student } from './student.entity';
export declare class Parent extends BaseEntity {
    name: string;
    phone: string;
    email: string;
    students: Student[];
}
