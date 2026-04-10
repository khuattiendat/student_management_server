import { PackageType } from '@/database/entities/package.entity';
export declare class UpdatePackageDto {
    name?: string;
    totalSessions?: number;
    price?: string;
    type?: PackageType;
    info: Record<string, any>;
}
