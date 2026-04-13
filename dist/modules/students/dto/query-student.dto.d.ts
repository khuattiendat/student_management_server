import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { PackageType } from '@/database/entities/package.entity';
type BirthMounth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export declare class QueryStudentDto extends BaseQueryDto {
    branchId?: string;
    packageId?: string;
    classId?: string;
    isCalled?: string;
    isTexted?: string;
    packageType?: PackageType;
    birthMonth?: BirthMounth;
}
export {};
