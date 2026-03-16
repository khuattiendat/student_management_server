import { IsEnum, IsOptional } from 'class-validator';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { ClassStatus } from '@/database/entities/class.entity';

export class QueryClassDto extends BaseQueryDto {
  @IsOptional()
  branchId?: string;

  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;
}
