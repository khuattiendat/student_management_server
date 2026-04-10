import { BaseEntity } from '@/common/base/base.entity';
import { Student } from './student.entity';
export declare class StudentRemainings extends BaseEntity {
    studentId: number;
    remainingSessions: number;
    student: Student;
}
