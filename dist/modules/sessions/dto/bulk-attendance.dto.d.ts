import { AttendanceStatus } from '@/database/entities/attendance.entity';
export declare class AttendanceStudentItemDto {
    studentId: number;
    status: AttendanceStatus;
    rate?: number;
    note?: string;
}
export declare class BulkAttendanceDto {
    attendances: AttendanceStudentItemDto[];
}
