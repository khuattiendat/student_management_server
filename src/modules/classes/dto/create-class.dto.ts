import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClassStatus, ClassType } from '@/database/entities/class.entity';

export interface WeekdayScheduleDto {
  startTime: string;
  endTime: string;
}

export class CreateClassDto {
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @MaxLength(255)
  roomName?: string;

  @IsInt()
  @Min(1)
  branchId: number;

  @IsInt()
  @Min(1)
  teacherId: number;

  @IsEnum(ClassType)
  type: ClassType;

  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;

  @IsDateString()
  startDate: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekdays: number[];

  @IsObject()
  scheduleByWeekday: Record<string, WeekdayScheduleDto>;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  studentIds?: number[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  packageIds?: number[];
}
