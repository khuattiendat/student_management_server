import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { PackageType } from '@/database/entities/package.entity';
export declare class QueryPackageDto extends BaseQueryDto {
    type?: PackageType;
}
