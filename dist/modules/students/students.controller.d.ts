import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { RenewStudentCourseDto } from './dto/renew-student-course.dto';
import { QueryStudentAttendanceDto } from './dto/query-student-attendance.dto';
import { QueryStudentsByEnrollmentsDto } from './dto/query-students-by-enrollments.dto';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { CycleDto } from './dto/cycle.dto';
import { UpdateIsPaidEnrollmentDto } from './dto/updateIsPaidEnrollment.dto';
import { UpdateEnrollmentsDto } from './dto/updateEnrollments.dto';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    create(createStudentDto: CreateStudentDto): Promise<{
        packageIds: number[];
        packages: import("../../database/entities/package.entity").Package[];
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
        birthday?: Date | null;
        addressDetail: string;
        provinceCode: number;
        wardCode: number;
        provinceName: string;
        wardName: string;
        phone: string;
        deletedByBranchId: number | null;
        branch: import("../../database/entities/branch.entity").Branch | null;
        enrollments: import("../../database/entities/enrollment.entity").Enrollment[];
        attendances: import("../../database/entities/attendance.entity").Attendance[];
        parents: import("../../database/entities/parent.entity").Parent[];
        classStudents: import("../../database/entities/class_student.entity").ClassStudent[];
        remainings: import("../../database/entities/student_remainings.entity").StudentRemainings[];
        id: number;
        createdAt: Date | null;
        updatedAt: Date | null;
        deletedAt: Date | null;
    }>;
    findAll(query: QueryStudentDto): Promise<{
        items: {
            packageIds: number[];
            packages: import("../../database/entities/package.entity").Package[];
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
            birthday?: Date | null;
            addressDetail: string;
            provinceCode: number;
            wardCode: number;
            provinceName: string;
            wardName: string;
            phone: string;
            deletedByBranchId: number | null;
            branch: import("../../database/entities/branch.entity").Branch | null;
            enrollments: import("../../database/entities/enrollment.entity").Enrollment[];
            attendances: import("../../database/entities/attendance.entity").Attendance[];
            parents: import("../../database/entities/parent.entity").Parent[];
            classStudents: import("../../database/entities/class_student.entity").ClassStudent[];
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
    findByEnrollments(query: QueryStudentsByEnrollmentsDto): Promise<{
        items: {
            packageIds: number[];
            packages: import("../../database/entities/package.entity").Package[];
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
            birthday?: Date | null;
            addressDetail: string;
            provinceCode: number;
            wardCode: number;
            provinceName: string;
            wardName: string;
            phone: string;
            deletedByBranchId: number | null;
            branch: import("../../database/entities/branch.entity").Branch | null;
            enrollments: import("../../database/entities/enrollment.entity").Enrollment[];
            attendances: import("../../database/entities/attendance.entity").Attendance[];
            parents: import("../../database/entities/parent.entity").Parent[];
            classStudents: import("../../database/entities/class_student.entity").ClassStudent[];
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
            status: import("../../database/entities/class.entity").ClassStatus;
            type: import("../../database/entities/class.entity").ClassType;
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
        schedule: import("../../database/entities/session.entity").Session[];
        students: {
            id: number;
            name: string;
            phone: string;
            cycleStartDate: Date | null;
            attendances: import("../../database/entities/attendance.entity").Attendance[];
        }[];
        totalSessions: number;
        totalStudents: number;
    }>;
    findAllTrash(query: BaseQueryDto): Promise<{
        items: import("../../database/entities/student.entity").Student[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<{
        packageIds: number[];
        packages: import("../../database/entities/package.entity").Package[];
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
        birthday?: Date | null;
        addressDetail: string;
        provinceCode: number;
        wardCode: number;
        provinceName: string;
        wardName: string;
        phone: string;
        deletedByBranchId: number | null;
        branch: import("../../database/entities/branch.entity").Branch | null;
        enrollments: import("../../database/entities/enrollment.entity").Enrollment[];
        attendances: import("../../database/entities/attendance.entity").Attendance[];
        parents: import("../../database/entities/parent.entity").Parent[];
        classStudents: import("../../database/entities/class_student.entity").ClassStudent[];
        remainings: import("../../database/entities/student_remainings.entity").StudentRemainings[];
        id: number;
        createdAt: Date | null;
        updatedAt: Date | null;
        deletedAt: Date | null;
    }>;
    findAttendances(id: number, query: QueryStudentAttendanceDto): Promise<{
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
    update(id: number, updateStudentDto: UpdateStudentDto): Promise<{
        packageIds: number[];
        packages: import("../../database/entities/package.entity").Package[];
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
        birthday?: Date | null;
        addressDetail: string;
        provinceCode: number;
        wardCode: number;
        provinceName: string;
        wardName: string;
        phone: string;
        deletedByBranchId: number | null;
        branch: import("../../database/entities/branch.entity").Branch | null;
        enrollments: import("../../database/entities/enrollment.entity").Enrollment[];
        attendances: import("../../database/entities/attendance.entity").Attendance[];
        parents: import("../../database/entities/parent.entity").Parent[];
        classStudents: import("../../database/entities/class_student.entity").ClassStudent[];
        remainings: import("../../database/entities/student_remainings.entity").StudentRemainings[];
        id: number;
        createdAt: Date | null;
        updatedAt: Date | null;
        deletedAt: Date | null;
    }>;
    updateCycleStartDate(id: number, cycleStartDate: Date | null): Promise<{
        message: string;
        id: number;
    }>;
    updateParentZaloName(parentId: number, zaloName: string): Promise<{
        message: string;
        parentId: number;
    }>;
    toggleIsCalled(id: number, isCalled: boolean): Promise<{
        message: string;
        id: number;
    }>;
    toggleIsTexted(id: number, isTexted: boolean): Promise<{
        message: string;
        id: number;
    }>;
    toggleIsPaid(id: number, enrollmentId: number, data: UpdateIsPaidEnrollmentDto): Promise<{
        message: string;
        enrollmentId: number;
        studentId: number;
    }>;
    updateEnrollments(id: number, data: UpdateEnrollmentsDto): Promise<{
        packageIds: number[];
        packages: import("../../database/entities/package.entity").Package[];
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
        birthday?: Date | null;
        addressDetail: string;
        provinceCode: number;
        wardCode: number;
        provinceName: string;
        wardName: string;
        phone: string;
        deletedByBranchId: number | null;
        branch: import("../../database/entities/branch.entity").Branch | null;
        enrollments: import("../../database/entities/enrollment.entity").Enrollment[];
        attendances: import("../../database/entities/attendance.entity").Attendance[];
        parents: import("../../database/entities/parent.entity").Parent[];
        classStudents: import("../../database/entities/class_student.entity").ClassStudent[];
        remainings: import("../../database/entities/student_remainings.entity").StudentRemainings[];
        id: number;
        createdAt: Date | null;
        updatedAt: Date | null;
        deletedAt: Date | null;
    }>;
    renewCourse(id: number, renewStudentCourseDto: RenewStudentCourseDto): Promise<{
        packageIds: number[];
        packages: import("../../database/entities/package.entity").Package[];
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
        birthday?: Date | null;
        addressDetail: string;
        provinceCode: number;
        wardCode: number;
        provinceName: string;
        wardName: string;
        phone: string;
        deletedByBranchId: number | null;
        branch: import("../../database/entities/branch.entity").Branch | null;
        enrollments: import("../../database/entities/enrollment.entity").Enrollment[];
        attendances: import("../../database/entities/attendance.entity").Attendance[];
        parents: import("../../database/entities/parent.entity").Parent[];
        classStudents: import("../../database/entities/class_student.entity").ClassStudent[];
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
}
