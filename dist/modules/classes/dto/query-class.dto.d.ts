import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { ClassStatus, ClassType } from '@/database/entities/class.entity';
export declare class QueryClassDto extends BaseQueryDto {
    branchId?: string;
    teacherId?: string;
    packageId?: string;
    type?: ClassType;
    status?: ClassStatus;
}
