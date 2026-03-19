import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsMilitaryTime,
  IsOptional,
  MaxLength,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClassStatus, ClassType } from '@/database/entities/class.entity';

export class UpdateClassDto {
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  branchId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  teacherId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  packageId?: number;

  @IsOptional()
  @IsEnum(ClassType)
  type?: ClassType;

  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekdays?: number[];

  @IsOptional()
  @IsMilitaryTime()
  startTime?: string;

  @IsOptional()
  @IsMilitaryTime()
  endTime?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  studentIds?: number[];
}
