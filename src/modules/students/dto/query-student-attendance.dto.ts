import { IsEnum, IsOptional } from 'class-validator';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { AttendanceStatus } from '@/database/entities/attendance.entity';

export class QueryStudentAttendanceDto extends BaseQueryDto {
  @IsOptional()
  classId?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}
