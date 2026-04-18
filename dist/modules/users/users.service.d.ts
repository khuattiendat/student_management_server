import { Repository } from 'typeorm';
import { User } from '@/database/entities/user.entity';
import { Branch } from '@/database/entities/branch.entity';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly userRepository;
    private readonly branchRepository;
    constructor(userRepository: Repository<User>, branchRepository: Repository<Branch>);
    findAll(query: QueryUserDto): Promise<{
        items: {
            id: number;
            name: string;
            userName: string;
            phone: string | undefined;
            branches: {
                id: number;
                name: string;
            }[];
            classes: {
                id: number;
                name: string;
            }[];
            role: import("@/database/entities/user.entity").UserRole;
            status: import("@/database/entities/user.entity").UserStatus;
            createdAt: Date | null;
            updatedAt: Date | null;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<{
        id: number;
        name: string;
        userName: string;
        phone: string | undefined;
        branches: {
            id: number;
            name: string;
        }[];
        classes: {
            id: number;
            name: string;
        }[];
        role: import("@/database/entities/user.entity").UserRole;
        status: import("@/database/entities/user.entity").UserStatus;
        createdAt: Date | null;
        updatedAt: Date | null;
    }>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<{
        id: number;
        name: string;
        userName: string;
        phone: string | undefined;
        branches: {
            id: number;
            name: string;
        }[];
        classes: {
            id: number;
            name: string;
        }[];
        role: import("@/database/entities/user.entity").UserRole;
        status: import("@/database/entities/user.entity").UserStatus;
        createdAt: Date | null;
        updatedAt: Date | null;
    }>;
    remove(id: number): Promise<{
        message: string;
        id: number;
    }>;
    private findUserById;
    private resolveBranches;
    private buildUserProfile;
    getBranchIdsForUser(userId: number): Promise<number[]>;
}
