import { BaseQueryDto } from '@/common/base/base.QueryDto';
export declare class QueryTeacherCodeDto extends BaseQueryDto {
    teacherId?: number;
    status: 'active' | 'inactive';
}
