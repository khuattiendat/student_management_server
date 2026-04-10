import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { QuerySessionDto } from './dto/query-session.dto';
import { QueryCalendarSessionDto } from './dto/query-calendar-session.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { AuthenticatedUser } from '@/common/interfaces/authenticated-user.interface';
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    create(createSessionDto: CreateSessionDto, user: AuthenticatedUser): Promise<import("../../database/entities/session.entity").Session>;
    findAll(query: QuerySessionDto): Promise<{
        items: import("../../database/entities/session.entity").Session[];
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
                status: import("../../database/entities/class.entity").ClassStatus;
                type: import("../../database/entities/class.entity").ClassType;
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
    findOne(id: number): Promise<import("../../database/entities/session.entity").Session>;
    update(id: number, updateSessionDto: UpdateSessionDto, user: AuthenticatedUser): Promise<import("../../database/entities/session.entity").Session>;
    remove(id: number, code: string, user: AuthenticatedUser): Promise<{
        message: string;
        code: string;
        id: number;
    }>;
    takeAttendance(id: number, bulkAttendanceDto: BulkAttendanceDto): Promise<{
        adjustedRemainings: {
            studentId: number;
            delta: number;
        }[];
        sessionId: number;
        classId: number;
        classType: import("../../database/entities/class.entity").ClassType;
        totalStudents: number;
        totalTaken: number;
        items: {
            studentId: number;
            student: import("../../database/entities/student.entity").Student;
            attendanceId: number | null;
            status: import("../../database/entities/attendance.entity").AttendanceStatus | null;
            rate: number | null;
        }[];
    }>;
    getAttendance(id: number): Promise<{
        sessionId: number;
        classId: number;
        classType: import("../../database/entities/class.entity").ClassType;
        totalStudents: number;
        totalTaken: number;
        items: {
            studentId: number;
            student: import("../../database/entities/student.entity").Student;
            attendanceId: number | null;
            status: import("../../database/entities/attendance.entity").AttendanceStatus | null;
            rate: number | null;
        }[];
    }>;
    updateAttendance(id: number, bulkAttendanceDto: BulkAttendanceDto): Promise<{
        sessionId: number;
        classId: number;
        classType: import("../../database/entities/class.entity").ClassType;
        totalStudents: number;
        totalTaken: number;
        items: {
            studentId: number;
            student: import("../../database/entities/student.entity").Student;
            attendanceId: number | null;
            status: import("../../database/entities/attendance.entity").AttendanceStatus | null;
            rate: number | null;
        }[];
    }>;
}
