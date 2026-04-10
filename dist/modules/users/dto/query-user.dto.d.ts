import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { UserRole, UserStatus } from '@/database/entities/user.entity';
export declare class QueryUserDto extends BaseQueryDto {
    role?: UserRole;
    status?: UserStatus;
    branchId?: string;
}
