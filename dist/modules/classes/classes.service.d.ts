import { Repository } from 'typeorm';
import { Class } from '@/database/entities/class.entity';
import { Branch } from '@/database/entities/branch.entity';
import { User } from '@/database/entities/user.entity';
import { Package } from '@/database/entities/package.entity';
import { Student } from '@/database/entities/student.entity';
import { Session } from '@/database/entities/session.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { QueryClassDto } from './dto/query-class.dto';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { AuthenticatedUser } from '@/common/interfaces/authenticated-user.interface';
import { UsersService } from '../users/users.service';
export declare class ClassesService {
    private readonly classRepository;
    private readonly branchRepository;
    private readonly userRepository;
    private readonly packageRepository;
    private readonly studentRepository;
    private readonly sessionRepository;
    private readonly userService;
    constructor(classRepository: Repository<Class>, branchRepository: Repository<Branch>, userRepository: Repository<User>, packageRepository: Repository<Package>, studentRepository: Repository<Student>, sessionRepository: Repository<Session>, userService: UsersService);
    create(createClassDto: CreateClassDto): Promise<Omit<Class, "classStudents" | "sessions" | "classPackages"> & {
        students: Student[];
        studentIds: number[];
        packages: Package[];
        packageIds: number[];
    }>;
    findAll(query: QueryClassDto, user: AuthenticatedUser): Promise<{
        items: (Omit<Class, "classStudents" | "sessions" | "classPackages"> & {
            students: Student[];
            studentIds: number[];
            packages: Package[];
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
        items: Class[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<Omit<Class, "classStudents" | "sessions" | "classPackages"> & {
        students: Student[];
        studentIds: number[];
        packages: Package[];
        packageIds: number[];
    }>;
    update(id: number, updateClassDto: UpdateClassDto): Promise<Omit<Class, "classStudents" | "sessions" | "classPackages"> & {
        students: Student[];
        studentIds: number[];
        packages: Package[];
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
    private ensureBranchExists;
    private ensureTeacherExists;
    private ensurePackageExists;
    private ensureClassTypeMatchesPackageType;
    private toClassType;
    private normalizeStudentIds;
    private normalizePackageIds;
    private ensurePackagesExist;
    private selectSessionPackage;
    private syncClassPackages;
    private ensureStudentsExist;
    private syncClassStudents;
    private createSessionsForClass;
    private regenerateFutureSessions;
    private normalizeWeekdays;
    private normalizeScheduleByWeekday;
    private toPersistedScheduleByWeekday;
    private resolveScheduleByWeekdayForUpdate;
    private extractScheduleFromSessions;
    private generateFutureSessionDates;
    private generateSessionDates;
    private collectMatchingDatesByCount;
    private collectMatchingDatesByRange;
    private toStartOfDay;
    private toDateOnlyString;
    private validateTimeRange;
    private validateMilitaryTime;
    private parseTimeToMinutes;
    private findClassWithRelations;
    private findManyByIdsWithRelations;
    private toClassResponse;
}
