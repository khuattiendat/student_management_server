import { IsEnum, IsOptional } from 'class-validator';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { PackageType } from '@/database/entities/package.entity';

type BirthMounth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export class QueryStudentDto extends BaseQueryDto {
  @IsOptional()
  branchId?: string;

  @IsOptional()
  packageId?: string;

  @IsOptional()
  classId?: string;

  @IsOptional()
  isCalled?: string;

  @IsOptional()
  isTexted?: string;

  @IsOptional()
  @IsEnum(PackageType)
  packageType?: PackageType;

  @IsOptional()
  birthMonth?: BirthMounth;
}
