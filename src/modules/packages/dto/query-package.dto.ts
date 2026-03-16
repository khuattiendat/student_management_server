import { IsEnum, IsOptional } from 'class-validator';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { PackageType } from '@/database/entities/package.entity';

export class QueryPackageDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(PackageType)
  type?: PackageType;
}
