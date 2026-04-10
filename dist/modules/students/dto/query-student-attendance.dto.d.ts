import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { AttendanceStatus } from '@/database/entities/attendance.entity';
export declare class QueryStudentAttendanceDto extends BaseQueryDto {
    classId?: string;
    status?: AttendanceStatus;
}
