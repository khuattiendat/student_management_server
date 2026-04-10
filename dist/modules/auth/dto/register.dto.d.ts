import { UserStatus } from '@/database/entities/user.entity';
export declare class RegisterDto {
    name: string;
    userName: string;
    password: string;
    phone?: string;
    status?: UserStatus;
    branchIds?: number[];
}
