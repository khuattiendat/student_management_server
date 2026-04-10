import { UserRole, UserStatus } from '@/database/entities/user.entity';
export declare class UpdateUserDto {
    name?: string;
    userName?: string;
    phone?: string;
    role?: UserRole;
    status?: UserStatus;
    branchIds?: number[];
}
