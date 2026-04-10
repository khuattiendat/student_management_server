import { Session } from './session.entity';
import { Student } from './student.entity';
import { BaseEntity } from '@/common/base/base.entity';
export declare enum AttendanceStatus {
    PRESENT = "present",
    LATE = "late",
    EXCUSED_ABSENT = "excused_absent",
    UNEXCUSED_ABSENT = "unexcused_absent",
    LATE_CANCEL_ABSENT = "late_cancel_absent"
}
export declare class Attendance extends BaseEntity {
    sessionId: number;
    studentId: number;
    status: AttendanceStatus;
    rate: number | null;
    session: Session;
    student: Student;
}
