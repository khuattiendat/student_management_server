import { Repository } from 'typeorm';
import { Branch } from '@/database/entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { AuthenticatedUser } from '@/common/interfaces/authenticated-user.interface';
import { UsersService } from '../users/users.service';
export declare class BranchesService {
    private readonly branchRepository;
    private readonly userService;
    constructor(branchRepository: Repository<Branch>, userService: UsersService);
    findAllWithClasses(user: AuthenticatedUser): Promise<Branch[]>;
    findAllTrash(query: BaseQueryDto): Promise<{
        items: Branch[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    create(createBranchDto: CreateBranchDto): Promise<Branch>;
    findAll(user: AuthenticatedUser, query: BaseQueryDto): Promise<{
        items: Branch[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<Branch>;
    update(id: number, updateBranchDto: UpdateBranchDto): Promise<Branch>;
    remove(id: number): Promise<{
        message: string;
        id: number;
    }>;
    forceRemove(id: number): Promise<{
        message: string;
        id: number;
    }>;
    restore(id: number): Promise<{
        message: string;
        id: number;
    }>;
    private ensureBranchExistsInRepository;
    private softDeleteRelatedUsersAndStudents;
    private hardDeleteRelatedUsersAndStudents;
    private restoreRelatedUsersAndStudents;
    private detachUsersFromBranch;
}
