import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@/database/entities/attendance.entity';

export class AttendanceStudentItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  studentId: number;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rate?: number;
}

export class BulkAttendanceDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((item: AttendanceStudentItemDto) => item.studentId)
  @ValidateNested({ each: true })
  @Type(() => AttendanceStudentItemDto)
  attendances: AttendanceStudentItemDto[];
}
