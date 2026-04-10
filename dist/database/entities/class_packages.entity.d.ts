import { BaseEntity } from '@/common/base/base.entity';
import { Class } from './class.entity';
import { Package } from './package.entity';
export declare class ClassPackage extends BaseEntity {
    packageId: number;
    classId: number;
    classEntity: Class;
    package: Package;
}
