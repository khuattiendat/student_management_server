import { BaseEntity } from '@/common/base/base.entity';
import { Class } from './class.entity';
import { Student } from './student.entity';
export declare class ClassStudent extends BaseEntity {
    classId: number;
    studentId: number;
    classEntity: Class;
    student: Student;
}
