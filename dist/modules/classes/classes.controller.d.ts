import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { QueryClassDto } from './dto/query-class.dto';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { AuthenticatedUser } from '@/common/interfaces/authenticated-user.interface';
export declare class ClassesController {
    private readonly classesService;
    constructor(classesService: ClassesService);
    create(createClassDto: CreateClassDto): Promise<Omit<import("../../database/entities/class.entity").Class, "classStudents" | "classPackages" | "sessions"> & {
        students: import("../../database/entities/student.entity").Student[];
        studentIds: number[];
        packages: import("../../database/entities/package.entity").Package[];
        packageIds: number[];
    }>;
    findAll(query: QueryClassDto, user: AuthenticatedUser): Promise<{
        items: (Omit<import("../../database/entities/class.entity").Class, "classStudents" | "classPackages" | "sessions"> & {
            students: import("../../database/entities/student.entity").Student[];
            studentIds: number[];
            packages: import("../../database/entities/package.entity").Package[];
            packageIds: number[];
        })[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findAllTrash(query: BaseQueryDto): Promise<{
        items: import("../../database/entities/class.entity").Class[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<Omit<import("../../database/entities/class.entity").Class, "classStudents" | "classPackages" | "sessions"> & {
        students: import("../../database/entities/student.entity").Student[];
        studentIds: number[];
        packages: import("../../database/entities/package.entity").Package[];
        packageIds: number[];
    }>;
    update(id: number, updateClassDto: UpdateClassDto): Promise<Omit<import("../../database/entities/class.entity").Class, "classStudents" | "classPackages" | "sessions"> & {
        students: import("../../database/entities/student.entity").Student[];
        studentIds: number[];
        packages: import("../../database/entities/package.entity").Package[];
        packageIds: number[];
    }>;
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
}
