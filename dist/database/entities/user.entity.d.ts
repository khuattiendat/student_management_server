import { BaseEntity } from '@/common/base/base.entity';
import { Branch } from './branch.entity';
import { Class } from './class.entity';
import { TeacherCode } from './teacherCode.entity';
export declare enum UserRole {
    ADMIN = "admin",
    TEACHER = "teacher",
    RECEPTIONIST = "receptionist"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive"
}
export declare class User extends BaseEntity {
    name: string;
    phone?: string;
    userName: string;
    password: string;
    role: UserRole;
    status: UserStatus;
    branches: Branch[];
    classes?: Class[];
    code?: TeacherCode[];
}
