import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { IsOptional } from 'class-validator';

export class QueryTeacherCodeDto extends BaseQueryDto {
  @IsOptional()
  teacherId?: number;
  @IsOptional()
  status: 'active' | 'inactive';
}
