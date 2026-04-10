import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { QueryPackageDto } from './dto/query-package.dto';
export declare class PackagesController {
    private readonly packagesService;
    constructor(packagesService: PackagesService);
    create(createPackageDto: CreatePackageDto): Promise<import("../../database/entities/package.entity").Package>;
    findAll(query: QueryPackageDto): Promise<{
        items: import("../../database/entities/package.entity").Package[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<import("../../database/entities/package.entity").Package>;
    update(id: number, updatePackageDto: UpdatePackageDto): Promise<import("../../database/entities/package.entity").Package>;
    remove(id: number): Promise<{
        message: string;
        id: number;
    }>;
}
