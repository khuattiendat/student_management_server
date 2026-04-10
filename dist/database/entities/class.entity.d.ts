import { BaseEntity } from '@/common/base/base.entity';
import { Branch } from './branch.entity';
import { Session } from './session.entity';
import { User } from './user.entity';
import { ClassStudent } from './class_student.entity';
import { ClassPackage } from './class_packages.entity';
export declare enum ClassStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    COMPLETED = "completed"
}
export declare enum ClassType {
    CERTIFICATE = "certificate",
    GENERAL = "general",
    SCHOOL_SUBJECT = "school_subject"
}
export declare class Class extends BaseEntity {
    branchId: number;
    teacherId?: number;
    packageId: number | null;
    type: ClassType;
    name: string;
    roomName: string | null;
    status: ClassStatus;
    startDate: Date;
    startTime: string | null;
    endTime: string | null;
    weekdays: number[];
    scheduleByWeekday: Record<string, {
        startTime: string;
        endTime: string;
    }> | null;
    branch: Branch;
    teacher: User | null;
    classStudents: ClassStudent[];
    classPackages: ClassPackage[];
    sessions: Session[];
}
