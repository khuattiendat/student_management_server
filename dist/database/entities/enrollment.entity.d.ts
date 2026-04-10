import { BaseEntity } from '@/common/base/base.entity';
import { Student } from './student.entity';
import { Package } from './package.entity';
export declare class Enrollment extends BaseEntity {
    studentId: number;
    packageId: number;
    remainingSessions: number;
    isPaid: boolean;
    student: Student;
    package: Package;
}
