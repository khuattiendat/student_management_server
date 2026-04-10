import { Repository } from 'typeorm';
import { Session } from '@/database/entities/session.entity';
import { Class, ClassType } from '@/database/entities/class.entity';
import { Attendance, AttendanceStatus } from '@/database/entities/attendance.entity';
import { ClassStudent } from '@/database/entities/class_student.entity';
import { Enrollment } from '@/database/entities/enrollment.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { QuerySessionDto } from './dto/query-session.dto';
import { QueryCalendarSessionDto } from './dto/query-calendar-session.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { AuthenticatedUser } from '@/common/interfaces/authenticated-user.interface';
import { TeacherCode } from '@/database/entities/teacherCode.entity';
export declare class SessionsService {
    private readonly sessionRepository;
    private readonly classRepository;
    private readonly attendanceRepository;
    private readonly classStudentRepository;
    private readonly enrollmentRepository;
    private readonly teacherCodeRepository;
    constructor(sessionRepository: Repository<Session>, classRepository: Repository<Class>, attendanceRepository: Repository<Attendance>, classStudentRepository: Repository<ClassStudent>, enrollmentRepository: Repository<Enrollment>, teacherCodeRepository: Repository<TeacherCode>);
    takeAttendance(sessionId: number, bulkAttendanceDto: BulkAttendanceDto): Promise<{
        adjustedRemainings: {
            studentId: number;
            delta: number;
        }[];
        sessionId: number;
        classId: number;
        classType: ClassType;
        totalStudents: number;
        totalTaken: number;
        items: {
            studentId: number;
            student: import("../../database/entities/student.entity").Student;
            attendanceId: number | null;
            status: AttendanceStatus | null;
            rate: number | null;
        }[];
    }>;
    getAttendance(sessionId: number): Promise<{
        sessionId: number;
        classId: number;
        classType: ClassType;
        totalStudents: number;
        totalTaken: number;
        items: {
            studentId: number;
            student: import("../../database/entities/student.entity").Student;
            attendanceId: number | null;
            status: AttendanceStatus | null;
            rate: number | null;
        }[];
    }>;
    updateAttendanceList(sessionId: number, bulkAttendanceDto: BulkAttendanceDto): Promise<{
        sessionId: number;
        classId: number;
        classType: ClassType;
        totalStudents: number;
        totalTaken: number;
        items: {
            studentId: number;
            student: import("../../database/entities/student.entity").Student;
            attendanceId: number | null;
            status: AttendanceStatus | null;
            rate: number | null;
        }[];
    }>;
    create(createSessionDto: CreateSessionDto, user: AuthenticatedUser): Promise<Session>;
    update(id: number, updateSessionDto: UpdateSessionDto, user: AuthenticatedUser): Promise<Session>;
    findAll(query: QuerySessionDto): Promise<{
        items: Session[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findCalendar(query: QueryCalendarSessionDto, user: AuthenticatedUser): Promise<{
        items: {
            id: number;
            title: string;
            sessionDate: string;
            startTime: string;
            endTime: string;
            start: string;
            end: string;
            class: {
                id: number;
                name: string;
                status: import("@/database/entities/class.entity").ClassStatus;
                type: ClassType;
                roomName: string | null;
                branch: {
                    id: number;
                    name: string;
                } | null;
                teacher: {
                    id: number;
                    name: string;
                } | null;
            };
        }[];
        total: number;
    }>;
    findOne(id: number): Promise<Session>;
    remove(id: number, code: string, user: AuthenticatedUser): Promise<{
        message: string;
        code: string;
        id: number;
    }>;
    private updateIsUsedTeacherCode;
    private codeValidation;
    private ensureClassExists;
    private findSessionWithClass;
    private buildSessionAttendanceResponse;
    private normalizeAttendances;
    private ensureStudentsInClass;
    private calculateGeneralConsumedSessionDelta;
    private applyGeneralRemainingAdjustments;
    private getGeneralClassPackageIds;
    private isAttendanceConsumed;
    private validateTimeRange;
    private toDateOnlyString;
}
