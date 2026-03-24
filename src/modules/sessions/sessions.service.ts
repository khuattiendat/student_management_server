import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, In, Repository } from 'typeorm';
import { Session } from '@/database/entities/session.entity';
import { Class, ClassType } from '@/database/entities/class.entity';
import {
  Attendance,
  AttendanceStatus,
} from '@/database/entities/attendance.entity';
import { ClassStudent } from '@/database/entities/class_student.entity';
import { Enrollment } from '@/database/entities/enrollment.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { QuerySessionDto } from './dto/query-session.dto';
import { QueryCalendarSessionDto } from './dto/query-calendar-session.dto';
import {
  AttendanceStudentItemDto,
  BulkAttendanceDto,
} from './dto/bulk-attendance.dto';
import { AuthenticatedUser } from '@/common/interfaces/authenticated-user.interface';
import { UserRole } from '@/database/entities/user.entity';
import { TeacherCode } from '@/database/entities/teacherCode.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(ClassStudent)
    private readonly classStudentRepository: Repository<ClassStudent>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(TeacherCode)
    private readonly teacherCodeRepository: Repository<TeacherCode>,
  ) {}

  async takeAttendance(
    sessionId: number,
    bulkAttendanceDto: BulkAttendanceDto,
  ) {
    const normalizedAttendances = this.normalizeAttendances(
      bulkAttendanceDto.attendances,
    );
    const studentIds = normalizedAttendances.map((item) => item.studentId);

    return this.sessionRepository.manager.transaction(async (manager) => {
      const session = await this.findSessionWithClass(sessionId, manager);

      await this.ensureStudentsInClass(session.classId, studentIds, manager);

      const attendanceRepository = manager.getRepository(Attendance);
      const existingAttendances = await attendanceRepository.find({
        where: {
          sessionId,
          studentId: In(studentIds),
        },
      });

      const existingAttendanceMap = new Map(
        existingAttendances.map((item) => [item.studentId, item]),
      );

      let consumedSessionDelta = new Map<number, number>();
      if (
        session.classEntity.type === ClassType.GENERAL ||
        session.classEntity.type === ClassType.SCHOOL_SUBJECT
      ) {
        const packageIds = this.getGeneralClassPackageIds(session.classEntity);
        consumedSessionDelta = this.calculateGeneralConsumedSessionDelta(
          normalizedAttendances,
          existingAttendanceMap,
        );
        await this.applyGeneralRemainingAdjustments(
          consumedSessionDelta,
          packageIds,
          manager,
        );
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

      const result = await this.buildSessionAttendanceResponse(
        sessionId,
        manager,
      );
      return {
        ...result,
        adjustedRemainings:
          session.classEntity.type === ClassType.GENERAL ||
          session.classEntity.type === ClassType.SCHOOL_SUBJECT
            ? [...consumedSessionDelta.entries()]
                .filter(([, delta]) => delta !== 0)
                .map(([studentId, delta]) => ({ studentId, delta }))
            : [],
      };
    });
  }

  async getAttendance(sessionId: number) {
    return this.buildSessionAttendanceResponse(sessionId);
  }

  async updateAttendanceList(
    sessionId: number,
    bulkAttendanceDto: BulkAttendanceDto,
  ) {
    const normalizedAttendances = this.normalizeAttendances(
      bulkAttendanceDto.attendances,
    );

    return this.sessionRepository.manager.transaction(async (manager) => {
      const session = await this.findSessionWithClass(sessionId, manager);
      const attendanceRepository = manager.getRepository(Attendance);

      const existingAttendances = await attendanceRepository.find({
        where: { sessionId },
      });

      const existingAttendanceMap = new Map(
        existingAttendances.map((item) => [item.studentId, item]),
      );
      const nextAttendanceMap = new Map(
        normalizedAttendances.map((item) => [item.studentId, item]),
      );

      const nextStudentIds = [...nextAttendanceMap.keys()];
      await this.ensureStudentsInClass(
        session.classId,
        nextStudentIds,
        manager,
      );

      if (
        session.classEntity.type === ClassType.GENERAL ||
        session.classEntity.type === ClassType.SCHOOL_SUBJECT
      ) {
        const packageIds = this.getGeneralClassPackageIds(session.classEntity);
        const affectedStudentIds = [
          ...new Set([
            ...existingAttendanceMap.keys(),
            ...nextAttendanceMap.keys(),
          ]),
        ];

        const deltaMap = new Map<number, number>();
        affectedStudentIds.forEach((studentId) => {
          const previousStatus = existingAttendanceMap.get(studentId)?.status;
          const nextStatus = nextAttendanceMap.get(studentId)?.status;

          const previousConsumed = previousStatus
            ? this.isAttendanceConsumed(previousStatus)
            : false;
          const nextConsumed = nextStatus
            ? this.isAttendanceConsumed(nextStatus)
            : false;

          deltaMap.set(
            studentId,
            Number(nextConsumed) - Number(previousConsumed),
          );
        });

        await this.applyGeneralRemainingAdjustments(
          deltaMap,
          packageIds,
          manager,
        );
      }

      await attendanceRepository.delete({ sessionId });

      if (normalizedAttendances.length > 0) {
        const insertRows = normalizedAttendances.map((item) =>
          attendanceRepository.create({
            sessionId,
            studentId: item.studentId,
            status: item.status,
            rate: item.rate ?? null,
          }),
        );
        await attendanceRepository.save(insertRows);
      }

      return this.buildSessionAttendanceResponse(sessionId, manager);
    });
  }

  async create(createSessionDto: CreateSessionDto, user: AuthenticatedUser) {
    const { code } = createSessionDto;
    const { role, sub: teacherId } = user;

    if (role === UserRole.TEACHER) {
      if (!code) {
        throw new BadRequestException(
          'Code is required for teacher to create session',
        );
      }
      const teacherCode = await this.codeValidation(teacherId, code);
      await this.updateIsUsedTeacherCode(teacherCode);
    }
    await this.ensureClassExists(createSessionDto.classId);
    this.validateTimeRange(
      createSessionDto.startTime,
      createSessionDto.endTime,
    );

    const session = this.sessionRepository.create({
      ...createSessionDto,
      sessionDate: new Date(createSessionDto.sessionDate),
    });

    return this.sessionRepository.save(session);
  }
  async update(
    id: number,
    updateSessionDto: UpdateSessionDto,
    user: AuthenticatedUser,
  ) {
    const { code } = updateSessionDto;
    const { role, sub: teacherId } = user;
    if (role === UserRole.TEACHER) {
      if (!code) {
        throw new BadRequestException(
          'Code is required for teacher to create session',
        );
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

  async findAll(query: QuerySessionDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);
    const startDate = query.startDate;

    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.classEntity', 'classEntity')
      .select([
        'session.id',
        'session.sessionDate',
        'session.startTime',
        'session.endTime',
        'classEntity.id',
        'classEntity.name',
      ])
      .orderBy('session.sessionDate', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.classId) {
      const classId = Number(query.classId);
      if (!Number.isInteger(classId) || classId < 1) {
        throw new BadRequestException('classId must be a positive integer');
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

  async findCalendar(query: QueryCalendarSessionDto, user: AuthenticatedUser) {
    if (query.startDate && query.endDate) {
      if (new Date(query.startDate) > new Date(query.endDate)) {
        throw new BadRequestException(
          'startDate must be before or equal to endDate',
        );
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

    if (user.role === UserRole.TEACHER) {
      queryBuilder.andWhere('classEntity.teacherId = :teacherId', {
        teacherId: user.sub,
      });
    }

    if (query.branchId) {
      const branchId = Number(query.branchId);
      if (!Number.isInteger(branchId) || branchId < 1) {
        throw new BadRequestException('branchId must be a positive integer');
      }
      queryBuilder.andWhere('branch.id = :branchId', { branchId });
    }
    const now = new Date();

    // Lấy thứ hiện tại (0 = CN, 1 = T2, ..., 6 = T7)
    const day = now.getDay();

    // Điều chỉnh để tuần bắt đầu từ Thứ 2
    const diffToMonday = day === 0 ? -6 : 1 - day;

    // Ngày đầu tuần (Thứ 2)
    const startDate = new Date(now);
    startDate.setDate(now.getDate() + diffToMonday);
    startDate.setHours(0, 0, 0, 0);

    // Ngày cuối tuần (Chủ nhật)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    if (query.startDate) {
      queryBuilder.andWhere('session.sessionDate >= :startDate', {
        startDate: query.startDate,
      });
    } else {
      queryBuilder.andWhere('session.sessionDate >= :startDate', {
        startDate: startDate,
      });
    }

    if (query.endDate) {
      queryBuilder.andWhere('session.sessionDate <= :endDate', {
        endDate: query.endDate,
      });
    } else {
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

  async findOne(id: number) {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ['classEntity'],
    });

    if (!session) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }

    return session;
  }

  async remove(id: number, code: string, user: AuthenticatedUser) {
    const { role, sub: teacherId } = user;

    const session = await this.findOne(id);

    if (role == UserRole.ADMIN) {
      await this.sessionRepository.delete(id);

      return {
        message: 'Session deleted successfully',
        code,
        id,
      };
    }

    if (!code) {
      throw new BadRequestException(
        'Code is required for teacher to delete session',
      );
    }
    const teacherCode = await this.codeValidation(teacherId, code);

    if (role === UserRole.TEACHER) {
      if (session.classEntity.teacherId !== teacherId) {
        throw new BadRequestException(
          'You do not have permission to delete this session',
        );
      }
    }
    if (session.classEntity.status === 'completed') {
      throw new BadRequestException(
        'Cannot delete session of a completed class',
      );
    }
    this.sessionRepository.manager.transaction(async (manager) => {
      const teacherCodeRepo = manager.getRepository(TeacherCode);
      const sessionRepo = manager.getRepository(Session);
      const attendanceRepo = manager.getRepository(Attendance);
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

  private async updateIsUsedTeacherCode(teacherCode: TeacherCode) {
    teacherCode.isUsed = true;
    await this.teacherCodeRepository.save(teacherCode);
  }
  private async codeValidation(
    teacherId: number,
    code: string,
  ): Promise<TeacherCode> {
    const teacherCode = await this.teacherCodeRepository.findOne({
      where: {
        teacherId,
        code,
      },
    });

    if (!teacherCode) {
      throw new BadRequestException('Mã xác nhận không hợp lệ');
    }
    if (teacherCode.isUsed) {
      throw new BadRequestException('Mã xác nhận đã được sử dụng');
    }
    if (teacherCode.expiresAt < new Date()) {
      throw new BadRequestException('Mã xác nhận đã hết hạn');
    }
    return teacherCode;
  }

  private async ensureClassExists(classId: number) {
    const classEntity = await this.classRepository.findOne({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new BadRequestException(`Invalid classId: ${classId}`);
    }
  }

  private async findSessionWithClass(
    sessionId: number,
    manager?: EntityManager,
  ): Promise<Session> {
    const sessionRepository =
      manager?.getRepository(Session) ?? this.sessionRepository;

    const session = await sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['classEntity', 'classEntity.classPackages'],
    });

    if (!session) {
      throw new NotFoundException(`Session with id ${sessionId} not found`);
    }

    return session;
  }

  private async buildSessionAttendanceResponse(
    sessionId: number,
    manager?: EntityManager,
  ) {
    const session = await this.findSessionWithClass(sessionId, manager);
    const classStudentRepository =
      manager?.getRepository(ClassStudent) ?? this.classStudentRepository;
    const attendanceRepository =
      manager?.getRepository(Attendance) ?? this.attendanceRepository;

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

    const attendanceMap = new Map(
      attendances.map((attendance) => [attendance.studentId, attendance]),
    );

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

  private normalizeAttendances(
    attendances: AttendanceStudentItemDto[],
  ): AttendanceStudentItemDto[] {
    return [
      ...new Map(attendances.map((item) => [item.studentId, item])).values(),
    ];
  }

  private async ensureStudentsInClass(
    classId: number,
    studentIds: number[],
    manager?: EntityManager,
  ): Promise<void> {
    if (studentIds.length === 0) {
      return;
    }

    const classStudentRepository =
      manager?.getRepository(ClassStudent) ?? this.classStudentRepository;

    const classStudents = await classStudentRepository.find({
      where: {
        classId,
        studentId: In(studentIds),
      },
      select: ['studentId'],
    });

    const validIds = new Set(classStudents.map((item) => item.studentId));
    const invalidStudentIds = studentIds.filter((id) => !validIds.has(id));

    if (invalidStudentIds.length > 0) {
      throw new BadRequestException(
        `Students are not enrolled in class ${classId}: ${invalidStudentIds.join(', ')}`,
      );
    }
  }

  private calculateGeneralConsumedSessionDelta(
    attendances: AttendanceStudentItemDto[],
    existingAttendanceMap: Map<number, Attendance>,
  ): Map<number, number> {
    const deltaMap = new Map<number, number>();

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

  private async applyGeneralRemainingAdjustments(
    consumedSessionDelta: Map<number, number>,
    packageIds: number[],
    manager?: EntityManager,
  ): Promise<void> {
    const uniquePackageIds = [...new Set(packageIds)];
    if (uniquePackageIds.length === 0) {
      throw new BadRequestException(
        'Class does not have any package configured for attendance deduction',
      );
    }

    const targetStudentIds = [...consumedSessionDelta.entries()]
      .filter(([, delta]) => delta !== 0)
      .map(([studentId]) => studentId);

    if (targetStudentIds.length === 0) {
      return;
    }

    const enrollmentRepository =
      manager?.getRepository(Enrollment) ?? this.enrollmentRepository;

    const enrollments = await enrollmentRepository.find({
      where: {
        studentId: In(targetStudentIds),
        packageId: In(uniquePackageIds),
      },
      order: {
        studentId: 'ASC',
        createdAt: 'ASC',
        id: 'ASC',
      },
    });

    const enrollmentsMap = new Map<number, Enrollment[]>();
    enrollments.forEach((item) => {
      const studentEnrollments = enrollmentsMap.get(item.studentId) ?? [];
      studentEnrollments.push(item);
      enrollmentsMap.set(item.studentId, studentEnrollments);
    });

    const updatedEnrollmentMap = new Map<number, Enrollment>();

    for (const studentId of targetStudentIds) {
      const delta = consumedSessionDelta.get(studentId) ?? 0;
      const studentEnrollments = enrollmentsMap.get(studentId) ?? [];

      if (studentEnrollments.length === 0) {
        throw new BadRequestException(
          `Enrollment not found for student ${studentId} and packages ${uniquePackageIds.join(', ')}`,
        );
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

  private getGeneralClassPackageIds(classEntity: Class): number[] {
    const classPackageIds =
      classEntity.classPackages
        ?.map((item) => item.packageId)
        .filter((packageId) => packageId > 0) ?? [];

    if (classPackageIds.length > 0) {
      return [...new Set(classPackageIds)];
    }

    if (!classEntity.packageId || classEntity.packageId < 1) {
      throw new BadRequestException(
        `Class ${classEntity.id} does not have valid packageIds for attendance deduction`,
      );
    }

    return [classEntity.packageId];
  }

  private isAttendanceConsumed(status: AttendanceStatus): boolean {
    return status !== AttendanceStatus.ABSENT;
  }

  private validateTimeRange(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException('endTime must be greater than startTime');
    }
  }

  private toDateOnlyString(value: Date | string): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return String(value).slice(0, 10);
  }
}
