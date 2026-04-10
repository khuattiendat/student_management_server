import { Repository } from 'typeorm';
import { Package } from '@/database/entities/package.entity';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { QueryPackageDto } from './dto/query-package.dto';
export declare class PackagesService {
    private readonly packageRepository;
    constructor(packageRepository: Repository<Package>);
    create(createPackageDto: CreatePackageDto): Promise<Package>;
    findAll(query: QueryPackageDto): Promise<{
        items: Package[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<Package>;
    update(id: number, updatePackageDto: UpdatePackageDto): Promise<Package>;
    remove(id: number): Promise<{
        message: string;
        id: number;
    }>;
}
