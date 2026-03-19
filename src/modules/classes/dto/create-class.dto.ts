import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsMilitaryTime,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClassStatus, ClassType } from '@/database/entities/class.entity';

export class CreateClassDto {
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsInt()
  @Min(1)
  branchId: number;

  @IsInt()
  @Min(1)
  teacherId: number;

  @IsInt()
  @Min(1)
  packageId: number;

  @IsOptional()
  @IsEnum(ClassType)
  type?: ClassType;

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

  @IsNotEmpty()
  @IsMilitaryTime()
  startTime: string;

  @IsNotEmpty()
  @IsMilitaryTime()
  endTime: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  studentIds?: number[];
}
