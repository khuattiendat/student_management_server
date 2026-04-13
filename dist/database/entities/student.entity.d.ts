import { BaseEntity } from '@/common/base/base.entity';
import { Branch } from './branch.entity';
import { Enrollment } from './enrollment.entity';
import { Attendance } from './attendance.entity';
import { Parent } from './parent.entity';
import { ClassStudent } from './class_student.entity';
import { StudentRemainings } from './student_remainings.entity';
export declare class Student extends BaseEntity {
    branchId: number | null;
    name: string;
    isCalled: boolean;
    isTexted: boolean;
    cycleStartDate: Date | null;
    birthday?: Date | null;
    addressDetail: string;
    provinceCode: number;
    wardCode: number;
    provinceName: string;
    wardName: string;
    phone: string;
    deletedByBranchId: number | null;
    branch: Branch | null;
    enrollments: Enrollment[];
    attendances: Attendance[];
    parents: Parent[];
    classStudents: ClassStudent[];
    remainings: StudentRemainings[];
}
