import { IsDateString, IsOptional } from 'class-validator';
import { BaseQueryDto } from '@/common/base/base.QueryDto';

export class QuerySessionDto extends BaseQueryDto {
  @IsOptional()
  classId?: string;

  @IsOptional()
  @IsDateString()
  sessionDate?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}
