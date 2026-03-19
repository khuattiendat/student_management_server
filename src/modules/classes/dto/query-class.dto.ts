import { IsEnum, IsOptional } from 'class-validator';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { ClassStatus, ClassType } from '@/database/entities/class.entity';

export class QueryClassDto extends BaseQueryDto {
  @IsOptional()
  branchId?: string;

  @IsOptional()
  teacherId?: string;

  @IsOptional()
  packageId?: string;

  @IsOptional()
  @IsEnum(ClassType)
  type?: ClassType;

  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;
}
