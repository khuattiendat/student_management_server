import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, In, Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { Session } from '@/database/entities/session.entity';
import { Class, ClassType } from '@/database/entities/class.entity';
import {
  Attendance,
  AttendanceStatus,
} from '@/database/entities/attendance.entity';
import { ClassStudent } from '@/database/entities/class_student.entity';
import { StudentRemainings } from '@/database/entities/student_remainings.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { QuerySessionDto } from './dto/query-session.dto';
import {
  AttendanceStudentItemDto,
  BulkAttendanceDto,
} from './dto/bulk-attendance.dto';

type SessionImportPayload = {
  classId: number;
  sessionDate: Date;
  startTime: string;
  endTime: string;
};

type SessionImportError = {
  row: number;
  field: string;
  message: string;
};

const IMPORT_MAX_ROWS = 5000;
const MAX_ERROR_PREVIEW = 50;
const HEADER_ALIASES = {
  classId: ['classId', 'class_id'],
  sessionDate: ['sessionDate', 'session_date', 'date'],
  startTime: ['startTime', 'start_time'],
  endTime: ['endTime', 'end_time'],
} as const;

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
    @InjectRepository(StudentRemainings)
    private readonly studentRemainingsRepository: Repository<StudentRemainings>,
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
      if (session.classEntity.type === ClassType.GENERAL) {
        consumedSessionDelta = this.calculateGeneralConsumedSessionDelta(
          normalizedAttendances,
          existingAttendanceMap,
        );
        await this.applyGeneralRemainingAdjustments(
          consumedSessionDelta,
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
          session.classEntity.type === ClassType.GENERAL
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

      if (session.classEntity.type === ClassType.GENERAL) {
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

        await this.applyGeneralRemainingAdjustments(deltaMap, manager);
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

  async create(createSessionDto: CreateSessionDto) {
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

  async findAll(query: QuerySessionDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);
    const search = query.search?.trim();

    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.classEntity', 'classEntity')
      .orderBy('session.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        new Brackets((builder) => {
          builder
            .where('classEntity.name LIKE :search', { search: `%${search}%` })
            .orWhere('session.startTime LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('session.endTime LIKE :search', { search: `%${search}%` })
            .orWhere('session.sessionDate LIKE :search', {
              search: `%${search}%`,
            });
        }),
      );
    }

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

  async update(id: number, updateSessionDto: UpdateSessionDto) {
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

  async remove(id: number) {
    const session = await this.findOne(id);
    await this.sessionRepository.remove(session);

    return {
      message: 'Session deleted successfully',
      id,
    };
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
      relations: ['classEntity'],
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
    manager?: EntityManager,
  ): Promise<void> {
    const targetStudentIds = [...consumedSessionDelta.entries()]
      .filter(([, delta]) => delta !== 0)
      .map(([studentId]) => studentId);

    if (targetStudentIds.length === 0) {
      return;
    }

    const studentRemainingsRepository =
      manager?.getRepository(StudentRemainings) ??
      this.studentRemainingsRepository;

    const remainings = await studentRemainingsRepository.find({
      where: { studentId: In(targetStudentIds) },
    });

    const remainingsMap = new Map(
      remainings.map((item) => [item.studentId, item]),
    );

    for (const studentId of targetStudentIds) {
      const delta = consumedSessionDelta.get(studentId) ?? 0;
      const existing = remainingsMap.get(studentId);
      const currentRemaining = existing?.remainingSessions ?? 0;
      const nextRemaining = currentRemaining - delta;

      if (nextRemaining < 0) {
        throw new BadRequestException(
          `Student ${studentId} does not have enough remaining sessions`,
        );
      }

      if (existing) {
        existing.remainingSessions = nextRemaining;
      } else {
        remainingsMap.set(
          studentId,
          studentRemainingsRepository.create({
            studentId,
            remainingSessions: nextRemaining,
          }),
        );
      }
    }

    await studentRemainingsRepository.save([...remainingsMap.values()]);
  }

  private isAttendanceConsumed(status: AttendanceStatus): boolean {
    return status !== AttendanceStatus.ABSENT;
  }

  private validateTimeRange(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException('endTime must be greater than startTime');
    }
  }
}
