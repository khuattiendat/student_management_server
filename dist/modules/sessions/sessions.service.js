"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const session_entity_1 = require("../../database/entities/session.entity");
const class_entity_1 = require("../../database/entities/class.entity");
const attendance_entity_1 = require("../../database/entities/attendance.entity");
const class_student_entity_1 = require("../../database/entities/class_student.entity");
const enrollment_entity_1 = require("../../database/entities/enrollment.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const teacherCode_entity_1 = require("../../database/entities/teacherCode.entity");
let SessionsService = class SessionsService {
    sessionRepository;
    classRepository;
    attendanceRepository;
    classStudentRepository;
    enrollmentRepository;
    teacherCodeRepository;
    constructor(sessionRepository, classRepository, attendanceRepository, classStudentRepository, enrollmentRepository, teacherCodeRepository) {
        this.sessionRepository = sessionRepository;
        this.classRepository = classRepository;
        this.attendanceRepository = attendanceRepository;
        this.classStudentRepository = classStudentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.teacherCodeRepository = teacherCodeRepository;
    }
    async takeAttendance(sessionId, bulkAttendanceDto) {
        const normalizedAttendances = this.normalizeAttendances(bulkAttendanceDto.attendances);
        const studentIds = normalizedAttendances.map((item) => item.studentId);
        return this.sessionRepository.manager.transaction(async (manager) => {
            const session = await this.findSessionWithClass(sessionId, manager);
            await this.ensureStudentsInClass(session.classId, studentIds, manager);
            const attendanceRepository = manager.getRepository(attendance_entity_1.Attendance);
            const existingAttendances = await attendanceRepository.find({
                where: {
                    sessionId,
                    studentId: (0, typeorm_2.In)(studentIds),
                },
            });
            const existingAttendanceMap = new Map(existingAttendances.map((item) => [item.studentId, item]));
            let consumedSessionDelta = new Map();
            if (session.classEntity.type === class_entity_1.ClassType.GENERAL ||
                session.classEntity.type === class_entity_1.ClassType.SCHOOL_SUBJECT) {
                const packageIds = this.getGeneralClassPackageIds(session.classEntity);
                consumedSessionDelta = this.calculateGeneralConsumedSessionDelta(normalizedAttendances, existingAttendanceMap);
                await this.applyGeneralRemainingAdjustments(consumedSessionDelta, packageIds, manager);
            }
            const upserts = normalizedAttendances.map((item) => {
                const existing = existingAttendanceMap.get(item.studentId);
                if (existing) {
                    existing.status = item.status;
                    existing.rate = item.rate ?? null;
                    return existing;
                }
                return attendanceRepository.create({
                    sessionId,
                    studentId: item.studentId,
                    status: item.status,
                    rate: item.rate ?? null,
                });
            });
            await attendanceRepository.save(upserts);
            const result = await this.buildSessionAttendanceResponse(sessionId, manager);
            return {
                ...result,
                adjustedRemainings: session.classEntity.type === class_entity_1.ClassType.GENERAL ||
                    session.classEntity.type === class_entity_1.ClassType.SCHOOL_SUBJECT
                    ? [...consumedSessionDelta.entries()]
                        .filter(([, delta]) => delta !== 0)
                        .map(([studentId, delta]) => ({ studentId, delta }))
                    : [],
            };
        });
    }
    async getAttendance(sessionId) {
        return this.buildSessionAttendanceResponse(sessionId);
    }
    async updateAttendanceList(sessionId, bulkAttendanceDto) {
        const normalizedAttendances = this.normalizeAttendances(bulkAttendanceDto.attendances);
        return this.sessionRepository.manager.transaction(async (manager) => {
            const session = await this.findSessionWithClass(sessionId, manager);
            const attendanceRepository = manager.getRepository(attendance_entity_1.Attendance);
            const existingAttendances = await attendanceRepository.find({
                where: { sessionId },
            });
            const existingAttendanceMap = new Map(existingAttendances.map((item) => [item.studentId, item]));
            const nextAttendanceMap = new Map(normalizedAttendances.map((item) => [item.studentId, item]));
            const nextStudentIds = [...nextAttendanceMap.keys()];
            await this.ensureStudentsInClass(session.classId, nextStudentIds, manager);
            if (session.classEntity.type === class_entity_1.ClassType.GENERAL ||
                session.classEntity.type === class_entity_1.ClassType.SCHOOL_SUBJECT) {
                const packageIds = this.getGeneralClassPackageIds(session.classEntity);
                const affectedStudentIds = [
                    ...new Set([
                        ...existingAttendanceMap.keys(),
                        ...nextAttendanceMap.keys(),
                    ]),
                ];
                const deltaMap = new Map();
                affectedStudentIds.forEach((studentId) => {
                    const previousStatus = existingAttendanceMap.get(studentId)?.status;
                    const nextStatus = nextAttendanceMap.get(studentId)?.status;
                    const previousConsumed = previousStatus
                        ? this.isAttendanceConsumed(previousStatus)
                        : false;
                    const nextConsumed = nextStatus
                        ? this.isAttendanceConsumed(nextStatus)
                        : false;
                    deltaMap.set(studentId, Number(nextConsumed) - Number(previousConsumed));
                });
                await this.applyGeneralRemainingAdjustments(deltaMap, packageIds, manager);
            }
            await attendanceRepository.delete({ sessionId });
            if (normalizedAttendances.length > 0) {
                const insertRows = normalizedAttendances.map((item) => attendanceRepository.create({
                    sessionId,
                    studentId: item.studentId,
                    status: item.status,
                    rate: item.rate ?? null,
                }));
                await attendanceRepository.save(insertRows);
            }
            return this.buildSessionAttendanceResponse(sessionId, manager);
        });
    }
    async create(createSessionDto, user) {
        const { code } = createSessionDto;
        const { role, sub: teacherId } = user;
        if (role === user_entity_1.UserRole.TEACHER) {
            if (!code) {
                throw new common_1.BadRequestException('Code is required for teacher to create session');
            }
            const teacherCode = await this.codeValidation(teacherId, code);
            await this.updateIsUsedTeacherCode(teacherCode);
        }
        await this.ensureClassExists(createSessionDto.classId);
        this.validateTimeRange(createSessionDto.startTime, createSessionDto.endTime);
        const session = this.sessionRepository.create({
            ...createSessionDto,
            sessionDate: new Date(createSessionDto.sessionDate),
        });
        return this.sessionRepository.save(session);
    }
    async update(id, updateSessionDto, user) {
        const { code } = updateSessionDto;
        const { role, sub: teacherId } = user;
        if (role === user_entity_1.UserRole.TEACHER) {
            if (!code) {
                throw new common_1.BadRequestException('Code is required for teacher to create session');
            }
            const teacherCode = await this.codeValidation(teacherId, code);
            await this.updateIsUsedTeacherCode(teacherCode);
        }
        const session = await this.findOne(id);
        if (updateSessionDto.classId !== undefined) {
            await this.ensureClassExists(updateSessionDto.classId);
        }
        const nextStartTime = updateSessionDto.startTime ?? session.startTime;
        const nextEndTime = updateSessionDto.endTime ?? session.endTime;
        this.validateTimeRange(nextStartTime, nextEndTime);
        Object.assign(session, {
            ...updateSessionDto,
            sessionDate: updateSessionDto.sessionDate
                ? new Date(updateSessionDto.sessionDate)
                : session.sessionDate,
        });
        return this.sessionRepository.save(session);
    }
    async findAll(query) {
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.max(Number(query.limit) || 10, 1);
        const startDate = query.startDate;
        const queryBuilder = this.sessionRepository
            .createQueryBuilder('session')
            .leftJoinAndSelect('session.classEntity', 'classEntity')
            .leftJoinAndSelect('session.attendances', 'attendance')
            .select([
            'session.id',
            'session.sessionDate',
            'session.startTime',
            'session.endTime',
            'classEntity.id',
            'classEntity.name',
            'attendance.id',
            'attendance.studentId',
            'attendance.status',
            'attendance.rate',
        ])
            .orderBy('session.sessionDate', 'ASC')
            .skip((page - 1) * limit)
            .take(limit);
        if (query.classId) {
            const classId = Number(query.classId);
            if (!Number.isInteger(classId) || classId < 1) {
                throw new common_1.BadRequestException('classId must be a positive integer');
            }
            queryBuilder.andWhere('session.classId = :classId', { classId });
        }
        if (query.sessionDate) {
            queryBuilder.andWhere('session.sessionDate = :sessionDate', {
                sessionDate: query.sessionDate,
            });
        }
        if (startDate) {
            queryBuilder.andWhere('session.sessionDate >= :startDate', {
                startDate,
            });
        }
        const [items, total] = await queryBuilder.getManyAndCount();
        return {
            items,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findCalendar(query, user) {
        if (query.startDate && query.endDate) {
            if (new Date(query.startDate) > new Date(query.endDate)) {
                throw new common_1.BadRequestException('startDate must be before or equal to endDate');
            }
        }
        const queryBuilder = this.sessionRepository
            .createQueryBuilder('session')
            .leftJoinAndSelect('session.classEntity', 'classEntity')
            .leftJoinAndSelect('classEntity.branch', 'branch')
            .leftJoinAndSelect('classEntity.teacher', 'teacher')
            .where('classEntity.status != :activeStatus', {
            activeStatus: 'completed',
        })
            .orderBy('session.sessionDate', 'ASC')
            .addOrderBy('session.startTime', 'ASC');
        if (user.role === user_entity_1.UserRole.TEACHER) {
            queryBuilder.andWhere('classEntity.teacherId = :teacherId', {
                teacherId: user.sub,
            });
        }
        if (query.branchId) {
            const branchId = Number(query.branchId);
            if (!Number.isInteger(branchId) || branchId < 1) {
                throw new common_1.BadRequestException('branchId must be a positive integer');
            }
            queryBuilder.andWhere('branch.id = :branchId', { branchId });
        }
        const now = new Date();
        const day = now.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const startDate = new Date(now);
        startDate.setDate(now.getDate() + diffToMonday);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        if (query.startDate) {
            queryBuilder.andWhere('session.sessionDate >= :startDate', {
                startDate: query.startDate,
            });
        }
        else {
            queryBuilder.andWhere('session.sessionDate >= :startDate', {
                startDate: startDate,
            });
        }
        if (query.endDate) {
            queryBuilder.andWhere('session.sessionDate <= :endDate', {
                endDate: query.endDate,
            });
        }
        else {
            queryBuilder.andWhere('session.sessionDate <= :endDate', {
                endDate: endDate,
            });
        }
        const items = await queryBuilder.getMany();
        return {
            items: items.map((session) => {
                const sessionDate = this.toDateOnlyString(session.sessionDate);
                return {
                    id: session.id,
                    title: session.classEntity?.name ?? `Session ${session.id}`,
                    sessionDate,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    start: `${sessionDate}T${session.startTime}`,
                    end: `${sessionDate}T${session.endTime}`,
                    class: {
                        id: session.classEntity?.id ?? null,
                        name: session.classEntity?.name ?? null,
                        status: session.classEntity?.status ?? null,
                        type: session.classEntity?.type ?? null,
                        roomName: session.classEntity?.roomName ?? null,
                        branch: session.classEntity?.branch
                            ? {
                                id: session.classEntity.branch.id,
                                name: session.classEntity.branch.name,
                            }
                            : null,
                        teacher: session.classEntity?.teacher
                            ? {
                                id: session.classEntity.teacher.id,
                                name: session.classEntity.teacher.name,
                            }
                            : null,
                    },
                };
            }),
            total: items.length,
        };
    }
    async findOne(id) {
        const session = await this.sessionRepository.findOne({
            where: { id },
            relations: ['classEntity'],
        });
        if (!session) {
            throw new common_1.NotFoundException(`Session with id ${id} not found`);
        }
        return session;
    }
    async remove(id, code, user) {
        const { role, sub: teacherId } = user;
        const session = await this.findOne(id);
        if (role == user_entity_1.UserRole.ADMIN) {
            await this.sessionRepository.delete(id);
            return {
                message: 'Session deleted successfully',
                code,
                id,
            };
        }
        if (!code) {
            throw new common_1.BadRequestException('Code is required for teacher to delete session');
        }
        const teacherCode = await this.codeValidation(teacherId, code);
        if (role === user_entity_1.UserRole.TEACHER) {
            if (session.classEntity.teacherId !== teacherId) {
                throw new common_1.BadRequestException('You do not have permission to delete this session');
            }
        }
        if (session.classEntity.status === 'completed') {
            throw new common_1.BadRequestException('Cannot delete session of a completed class');
        }
        this.sessionRepository.manager.transaction(async (manager) => {
            const teacherCodeRepo = manager.getRepository(teacherCode_entity_1.TeacherCode);
            const sessionRepo = manager.getRepository(session_entity_1.Session);
            const attendanceRepo = manager.getRepository(attendance_entity_1.Attendance);
            teacherCode.isUsed = true;
            await teacherCodeRepo.save(teacherCode);
            await sessionRepo.delete(id);
            await attendanceRepo.delete({ sessionId: id });
        });
        return {
            message: 'Session deleted successfully',
            code,
            id,
        };
    }
    async updateIsUsedTeacherCode(teacherCode) {
        teacherCode.isUsed = true;
        await this.teacherCodeRepository.save(teacherCode);
    }
    async codeValidation(teacherId, code) {
        const teacherCode = await this.teacherCodeRepository.findOne({
            where: {
                teacherId,
                code,
            },
        });
        if (!teacherCode) {
            throw new common_1.BadRequestException('Mã xác nhận không hợp lệ');
        }
        if (teacherCode.isUsed) {
            throw new common_1.BadRequestException('Mã xác nhận đã được sử dụng');
        }
        if (teacherCode.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Mã xác nhận đã hết hạn');
        }
        return teacherCode;
    }
    async ensureClassExists(classId) {
        const classEntity = await this.classRepository.findOne({
            where: { id: classId },
        });
        if (!classEntity) {
            throw new common_1.BadRequestException(`Invalid classId: ${classId}`);
        }
    }
    async findSessionWithClass(sessionId, manager) {
        const sessionRepository = manager?.getRepository(session_entity_1.Session) ?? this.sessionRepository;
        const session = await sessionRepository.findOne({
            where: { id: sessionId },
            relations: ['classEntity', 'classEntity.classPackages'],
        });
        if (!session) {
            throw new common_1.NotFoundException(`Session with id ${sessionId} not found`);
        }
        return session;
    }
    async buildSessionAttendanceResponse(sessionId, manager) {
        const session = await this.findSessionWithClass(sessionId, manager);
        const classStudentRepository = manager?.getRepository(class_student_entity_1.ClassStudent) ?? this.classStudentRepository;
        const attendanceRepository = manager?.getRepository(attendance_entity_1.Attendance) ?? this.attendanceRepository;
        const [classStudents, attendances] = await Promise.all([
            classStudentRepository.find({
                where: { classId: session.classId },
                relations: ['student'],
            }),
            attendanceRepository.find({
                where: { sessionId },
                relations: ['student'],
            }),
        ]);
        const attendanceMap = new Map(attendances.map((attendance) => [attendance.studentId, attendance]));
        const items = classStudents.map((classStudent) => {
            const attendance = attendanceMap.get(classStudent.studentId);
            return {
                studentId: classStudent.studentId,
                student: classStudent.student,
                attendanceId: attendance?.id ?? null,
                status: attendance?.status ?? null,
                rate: attendance?.rate ?? null,
            };
        });
        return {
            sessionId: session.id,
            classId: session.classId,
            classType: session.classEntity.type,
            totalStudents: items.length,
            totalTaken: attendances.length,
            items,
        };
    }
    normalizeAttendances(attendances) {
        return [
            ...new Map(attendances.map((item) => [item.studentId, item])).values(),
        ];
    }
    async ensureStudentsInClass(classId, studentIds, manager) {
        if (studentIds.length === 0) {
            return;
        }
        const classStudentRepository = manager?.getRepository(class_student_entity_1.ClassStudent) ?? this.classStudentRepository;
        const classStudents = await classStudentRepository.find({
            where: {
                classId,
                studentId: (0, typeorm_2.In)(studentIds),
            },
            select: ['studentId'],
        });
        const validIds = new Set(classStudents.map((item) => item.studentId));
        const invalidStudentIds = studentIds.filter((id) => !validIds.has(id));
        if (invalidStudentIds.length > 0) {
            throw new common_1.BadRequestException(`Students are not enrolled in class ${classId}: ${invalidStudentIds.join(', ')}`);
        }
    }
    calculateGeneralConsumedSessionDelta(attendances, existingAttendanceMap) {
        const deltaMap = new Map();
        attendances.forEach((item) => {
            const existing = existingAttendanceMap.get(item.studentId);
            const previousConsumed = existing
                ? this.isAttendanceConsumed(existing.status)
                : false;
            const nextConsumed = this.isAttendanceConsumed(item.status);
            const delta = Number(nextConsumed) - Number(previousConsumed);
            deltaMap.set(item.studentId, delta);
        });
        return deltaMap;
    }
    async applyGeneralRemainingAdjustments(consumedSessionDelta, packageIds, manager) {
        const uniquePackageIds = [...new Set(packageIds)];
        if (uniquePackageIds.length === 0) {
            throw new common_1.BadRequestException('Class does not have any package configured for attendance deduction');
        }
        const targetStudentIds = [...consumedSessionDelta.entries()]
            .filter(([, delta]) => delta !== 0)
            .map(([studentId]) => studentId);
        if (targetStudentIds.length === 0) {
            return;
        }
        const enrollmentRepository = manager?.getRepository(enrollment_entity_1.Enrollment) ?? this.enrollmentRepository;
        const enrollments = await enrollmentRepository.find({
            where: {
                studentId: (0, typeorm_2.In)(targetStudentIds),
                packageId: (0, typeorm_2.In)(uniquePackageIds),
            },
            order: {
                studentId: 'ASC',
                createdAt: 'ASC',
                id: 'ASC',
            },
        });
        const enrollmentsMap = new Map();
        enrollments.forEach((item) => {
            const studentEnrollments = enrollmentsMap.get(item.studentId) ?? [];
            studentEnrollments.push(item);
            enrollmentsMap.set(item.studentId, studentEnrollments);
        });
        const updatedEnrollmentMap = new Map();
        for (const studentId of targetStudentIds) {
            const delta = consumedSessionDelta.get(studentId) ?? 0;
            const studentEnrollments = enrollmentsMap.get(studentId) ?? [];
            if (studentEnrollments.length === 0) {
                throw new common_1.BadRequestException(`Enrollment not found for student ${studentId} and packages ${uniquePackageIds.join(', ')}`);
            }
            const lastEnrollment = studentEnrollments[studentEnrollments.length - 1];
            if (delta > 0) {
                let remainingToDeduct = delta;
                for (const enrollment of studentEnrollments) {
                    if (remainingToDeduct === 0) {
                        break;
                    }
                    const currentRemaining = enrollment.remainingSessions ?? 0;
                    if (currentRemaining <= 0) {
                        continue;
                    }
                    const deducted = Math.min(currentRemaining, remainingToDeduct);
                    enrollment.remainingSessions = currentRemaining - deducted;
                    remainingToDeduct -= deducted;
                    updatedEnrollmentMap.set(enrollment.id, enrollment);
                }
                if (remainingToDeduct > 0) {
                    const currentRemaining = lastEnrollment.remainingSessions ?? 0;
                    lastEnrollment.remainingSessions =
                        currentRemaining - remainingToDeduct;
                    updatedEnrollmentMap.set(lastEnrollment.id, lastEnrollment);
                }
            }
            if (delta < 0) {
                const currentRemaining = lastEnrollment.remainingSessions ?? 0;
                lastEnrollment.remainingSessions = currentRemaining + Math.abs(delta);
                updatedEnrollmentMap.set(lastEnrollment.id, lastEnrollment);
            }
        }
        if (updatedEnrollmentMap.size > 0) {
            await enrollmentRepository.save([...updatedEnrollmentMap.values()]);
        }
    }
    getGeneralClassPackageIds(classEntity) {
        const classPackageIds = classEntity.classPackages
            ?.map((item) => item.packageId)
            .filter((packageId) => packageId > 0) ?? [];
        if (classPackageIds.length > 0) {
            return [...new Set(classPackageIds)];
        }
        if (!classEntity.packageId || classEntity.packageId < 1) {
            throw new common_1.BadRequestException(`Class ${classEntity.id} does not have valid packageIds for attendance deduction`);
        }
        return [classEntity.packageId];
    }
    isAttendanceConsumed(status) {
        return status !== attendance_entity_1.AttendanceStatus.EXCUSED_ABSENT;
    }
    validateTimeRange(startTime, endTime) {
        if (startTime >= endTime) {
            throw new common_1.BadRequestException('endTime must be greater than startTime');
        }
    }
    toDateOnlyString(value) {
        if (value instanceof Date) {
            return value.toISOString().slice(0, 10);
        }
        return String(value).slice(0, 10);
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __param(1, (0, typeorm_1.InjectRepository)(class_entity_1.Class)),
    __param(2, (0, typeorm_1.InjectRepository)(attendance_entity_1.Attendance)),
    __param(3, (0, typeorm_1.InjectRepository)(class_student_entity_1.ClassStudent)),
    __param(4, (0, typeorm_1.InjectRepository)(enrollment_entity_1.Enrollment)),
    __param(5, (0, typeorm_1.InjectRepository)(teacherCode_entity_1.TeacherCode)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map