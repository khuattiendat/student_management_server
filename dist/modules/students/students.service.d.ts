import { Repository } from 'typeorm';
import { Student } from '@/database/entities/student.entity';
import { Branch } from '@/database/entities/branch.entity';
import { Parent } from '@/database/entities/parent.entity';
import { Package } from '@/database/entities/package.entity';
import { Enrollment } from '@/database/entities/enrollment.entity';
import { Attendance } from '@/database/entities/attendance.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { RenewStudentCourseDto } from './dto/renew-student-course.dto';
import { QueryStudentAttendanceDto } from './dto/query-student-attendance.dto';
import { QueryStudentsByEnrollmentsDto } from './dto/query-students-by-enrollments.dto';
import { CycleDto } from './dto/cycle.dto';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { ClassStudent } from '@/database/entities/class_student.entity';
import { Session } from '@/database/entities/session.entity';
import { Class } from '@/database/entities/class.entity';
import { UpdateIsPaidEnrollmentDto } from './dto/updateIsPaidEnrollment.dto';
export declare class StudentsService {
    private readonly studentRepository;
    private readonly branchRepository;
    private readonly parentRepository;
    private readonly packageRepository;
    private readonly enrollmentRepository;
    private readonly attendanceRepository;
    private readonly sessionRepository;
    private readonly classRepository;
    private readonly classStudentRepository;
    constructor(studentRepository: Repository<Student>, branchRepository: Repository<Branch>, parentRepository: Repository<Parent>, packageRepository: Repository<Package>, enrollmentRepository: Repository<Enrollment>, attendanceRepository: Repository<Attendance>, sessionRepository: Repository<Session>, classRepository: Repository<Class>, classStudentRepository: Repository<ClassStudent>);
    create(createStudentDto: CreateStudentDto): Promise<{
        packageIds: number[];
        packages: Package[];
        remainingByPackage: {
            packageId: number;
            packageName: string;
            remainingSessions: number;
        }[];
        learnedSessions: number;
        remainingSessions: number;
        branchId: number | null;
        name: string;
        isCalled: boolean;
        isTexted: boolean;
        cycleStartDate: Date | null;
        birthday: string;
        addressDetail: string;
        provinceCode: number;
        wardCode: number;
        provinceName: string;
        wardName: string;
        phone: string;
        deletedByBranchId: number | null;
        branch: Branch | null;
        enrollments: Enrollment[];
        attendances: Attendance[];
        parents: Parent[];
        classStudents: ClassStudent[];
        remainings: import("../../database/entities/student_remainings.entity").StudentRemainings[];
        id: number;
        createdAt: Date | null;
        updatedAt: Date | null;
        deletedAt: Date | null;
    }>;
    findAll(query: QueryStudentDto): Promise<{
        items: {
            packageIds: number[];
            packages: Package[];
            remainingByPackage: {
                packageId: number;
                packageName: string;
                remainingSessions: number;
            }[];
            learnedSessions: number;
            remainingSessions: number;
            branchId: number | null;
            name: string;
            isCalled: boolean;
            isTexted: boolean;
            cycleStartDate: Date | null;
            birthday: string;
            addressDetail: string;
            provinceCode: number;
            wardCode: number;
            provinceName: string;
            wardName: string;
            phone: string;
            deletedByBranchId: number | null;
            branch: Branch | null;
            enrollments: Enrollment[];
            attendances: Attendance[];
            parents: Parent[];
            classStudents: ClassStudent[];
            remainings: import("../../database/entities/student_remainings.entity").StudentRemainings[];
            id: number;
            createdAt: Date | null;
            updatedAt: Date | null;
            deletedAt: Date | null;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<{
        packageIds: number[];
        packages: Package[];
        remainingByPackage: {
            packageId: number;
            packageName: string;
            remainingSessions: number;
        }[];
        learnedSessions: number;
        remainingSessions: number;
        branchId: number | null;
        name: string;
        isCalled: boolean;
        isTexted: boolean;
        cycleStartDate: Date | null;
        birthday: string;
        addressDetail: string;
        provinceCode: number;
        wardCode: number;
        provinceName: string;
        wardName: string;
        phone: string;
        deletedByBranchId: number | null;
        branch: Branch | null;
        enrollments: Enrollment[];
        attendances: Attendance[];
        parents: Parent[];
        classStudents: ClassStudent[];
        remainings: import("../../database/entities/student_remainings.entity").StudentRemainings[];
        id: number;
        createdAt: Date | null;
        updatedAt: Date | null;
        deletedAt: Date | null;
    }>;
    findAllTrash(query: BaseQueryDto): Promise<{
        items: Student[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findByEnrollments(query: QueryStudentsByEnrollmentsDto): Promise<{
        items: {
            packageIds: number[];
            packages: Package[];
            remainingByPackage: {
                packageId: number;
                packageName: string;
                remainingSessions: number;
            }[];
            learnedSessions: number;
            remainingSessions: number;
            branchId: number | null;
            name: string;
            isCalled: boolean;
            isTexted: boolean;
            cycleStartDate: Date | null;
            birthday: string;
            addressDetail: string;
            provinceCode: number;
            wardCode: number;
            provinceName: string;
            wardName: string;
            phone: string;
            deletedByBranchId: number | null;
            branch: Branch | null;
            enrollments: Enrollment[];
            attendances: Attendance[];
            parents: Parent[];
            classStudents: ClassStudent[];
            remainings: import("../../database/entities/student_remainings.entity").StudentRemainings[];
            id: number;
            createdAt: Date | null;
            updatedAt: Date | null;
            deletedAt: Date | null;
        }[];
        total: number;
        branchId: number;
        packageIds: number[];
    }>;
    getCycleStudents(query: CycleDto): Promise<{
        class: {
            id: number;
            name: string;
            status: import("@/database/entities/class.entity").ClassStatus;
            type: import("@/database/entities/class.entity").ClassType;
            roomName: string | null;
            startDate: Date;
            startTime: string | null;
            endTime: string | null;
            weekdays: number[];
            scheduleByWeekday: Record<string, {
                startTime: string;
                endTime: string;
            }> | null;
            branch: {
                id: number;
                name: string;
            } | null;
            teacher: {
                id: number;
                name: string;
            } | null;
        };
        schedule: Session[];
        students: {
            id: number;
            name: string;
            phone: string;
            cycleStartDate: Date | null;
            attendances: Attendance[];
        }[];
        totalSessions: number;
        totalStudents: number;
    }>;
    findAttendances(studentId: number, query: QueryStudentAttendanceDto): Promise<{
        items: any[];
        studentClass: {
            id: number;
            name: string;
        }[] | undefined;
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    updateCycleStartDate(id: number, cycleStartDate: Date | null): Promise<{
        message: string;
        id: number;
    }>;
    updateIsCalled(id: number, isCalled: boolean): Promise<{
        message: string;
        id: number;
    }>;
    updateIsTexted(id: number, isTexted: boolean): Promise<{
        message: string;
        id: number;
    }>;
    updateIsPaidEnrollment(id: number, enrollmentId: number, data: UpdateIsPaidEnrollmentDto): Promise<{
        message: string;
        enrollmentId: number;
        studentId: number;
    }>;
    update(id: number, updateStudentDto: UpdateStudentDto): Promise<{
        packageIds: number[];
        packages: Package[];
        remainingByPackage: {
            packageId: number;
            packageName: string;
            remainingSessions: number;
        }[];
        learnedSessions: number;
        remainingSessions: number;
        branchId: number | null;
        name: string;
        isCalled: boolean;
        isTexted: boolean;
        cycleStartDate: Date | null;
        birthday: string;
        addressDetail: string;
        provinceCode: number;
        wardCode: number;
        provinceName: string;
        wardName: string;
        phone: string;
        deletedByBranchId: number | null;
        branch: Branch | null;
        enrollments: Enrollment[];
        attendances: Attendance[];
        parents: Parent[];
        classStudents: ClassStudent[];
        remainings: import("../../database/entities/student_remainings.entity").StudentRemainings[];
        id: number;
        createdAt: Date | null;
        updatedAt: Date | null;
        deletedAt: Date | null;
    }>;
    renewCourse(id: number, renewStudentCourseDto: RenewStudentCourseDto): Promise<{
        packageIds: number[];
        packages: Package[];
        remainingByPackage: {
            packageId: number;
            packageName: string;
            remainingSessions: number;
        }[];
        learnedSessions: number;
        remainingSessions: number;
        branchId: number | null;
        name: string;
        isCalled: boolean;
        isTexted: boolean;
        cycleStartDate: Date | null;
        birthday: string;
        addressDetail: string;
        provinceCode: number;
        wardCode: number;
        provinceName: string;
        wardName: string;
        phone: string;
        deletedByBranchId: number | null;
        branch: Branch | null;
        enrollments: Enrollment[];
        attendances: Attendance[];
        parents: Parent[];
        classStudents: ClassStudent[];
        remainings: import("../../database/entities/student_remainings.entity").StudentRemainings[];
        id: number;
        createdAt: Date | null;
        updatedAt: Date | null;
        deletedAt: Date | null;
    }>;
    remove(id: number): Promise<{
        message: string;
        id: number;
    }>;
    restore(id: number): Promise<{
        message: string;
        id: number;
    }>;
    forceRemove(id: number): Promise<{
        message: string;
        id: number;
    }>;
    private findStudentEntityById;
    private softDeleteStudentRelations;
    private restoreStudentRelations;
    private forceDeleteStudentRelations;
    private ensureBranchExists;
    private normalizeIds;
    private parsePackageIdsFromQuery;
    private ensurePackagesExist;
    private resolveParents;
    private uniqueParents;
    private syncEnrollments;
    private appendEnrollments;
    private getStudentSessionStats;
    private buildStudentProfile;
    private normalizeAttendanceResponse;
    private extractScheduleByWeekdayFromSessions;
}
