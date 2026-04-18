import { Session } from './session.entity';
import { Student } from './student.entity';
import { BaseEntity } from '@/common/base/base.entity';
export declare enum AttendanceStatus {
    PRESENT = "present",
    LATE = "late",
    UNEXCUSED_ABSENT = "unexcused_absent",
    LATE_CANCEL_ABSENT = "late_cancel_absent",
    EXCUSED_ABSENT = "excused_absent",
    UNJUSTIFIED_LEAVE = "unjustified_leave"
}
export declare class Attendance extends BaseEntity {
    sessionId: number;
    studentId: number;
    status: AttendanceStatus;
    rate?: number | null;
    note?: string | null;
    session: Session;
    student: Student;
}
