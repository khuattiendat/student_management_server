import { IsOptional } from 'class-validator';
import { BaseQueryDto } from '@/common/base/base.QueryDto';

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
}
