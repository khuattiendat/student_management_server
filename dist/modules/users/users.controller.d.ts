import { UsersService } from './users.service';
import { UserRole } from '@/database/entities/user.entity';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
            role: UserRole;
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
        role: UserRole;
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
        role: UserRole;
        status: import("@/database/entities/user.entity").UserStatus;
        createdAt: Date | null;
        updatedAt: Date | null;
    }>;
    remove(id: number): Promise<{
        message: string;
        id: number;
    }>;
}
