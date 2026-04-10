import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { AuthenticatedUser } from '@/common/interfaces/authenticated-user.interface';
export declare class BranchesController {
    private readonly branchesService;
    constructor(branchesService: BranchesService);
    create(createBranchDto: CreateBranchDto): Promise<import("../../database/entities/branch.entity").Branch>;
    findAll(query: BaseQueryDto): Promise<{
        items: import("../../database/entities/branch.entity").Branch[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findAllTrash(query: BaseQueryDto): Promise<{
        items: import("../../database/entities/branch.entity").Branch[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<import("../../database/entities/branch.entity").Branch>;
    update(id: number, updateBranchDto: UpdateBranchDto): Promise<import("../../database/entities/branch.entity").Branch>;
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
    findAllWithClasses(user: AuthenticatedUser): Promise<import("../../database/entities/branch.entity").Branch[]>;
}
