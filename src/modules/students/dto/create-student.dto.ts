import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StudentParentDto } from './student-parent.dto';

export class CreateStudentDto {
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @MaxLength(255)
  addressDetail?: string;

  @IsOptional()
  provinceCode?: number;

  @IsOptional()
  wardCode?: number;

  @IsOptional()
  @MaxLength(255)
  provinceName?: string;

  @IsOptional()
  @MaxLength(255)
  wardName?: string;

  @IsOptional()
  birthday?: string;

  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  branchId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentParentDto)
  parents?: StudentParentDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  packageIds?: number[];
}
