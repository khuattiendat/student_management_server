import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, In, Repository } from 'typeorm';
import { Class, ClassType } from '@/database/entities/class.entity';
import { Branch } from '@/database/entities/branch.entity';
import { User, UserRole } from '@/database/entities/user.entity';
import { Package, PackageType } from '@/database/entities/package.entity';
import { Student } from '@/database/entities/student.entity';
import { ClassStudent } from '@/database/entities/class_student.entity';
import { Session } from '@/database/entities/session.entity';
import { Attendance } from '@/database/entities/attendance.entity';
import { ClassPackage } from '@/database/entities/class_packages.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { QueryClassDto } from './dto/query-class.dto';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { AuthenticatedUser } from '@/common/interfaces/authenticated-user.interface';

type WeekdaySchedule = {
  startTime: string;
  endTime: string;
};

type ScheduleByWeekday = Record<number, WeekdaySchedule>;

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Package)
    private readonly packageRepository: Repository<Package>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async create(createClassDto: CreateClassDto) {
    const studentIds = this.normalizeStudentIds(createClassDto.studentIds);
    const packageIds = this.normalizePackageIds(createClassDto.packageIds);

    return this.classRepository.manager.transaction(async (manager) => {
      const [branch, teacher] = await Promise.all([
        this.ensureBranchExists(createClassDto.branchId, manager),
        this.ensureTeacherExists(createClassDto.teacherId, manager),
      ]);

      const classType = createClassDto.type;
      let selectedPackage: Package | null = null;

      if (packageIds.length > 0) {
        const packageEntities = await this.ensurePackagesExist(
          packageIds,
          manager,
        );
        // Validate all packages match class type
        packageEntities.forEach((pkg) => {
          const packageClassType = this.toClassType(pkg.type);
          this.ensureClassTypeMatchesPackageType(classType, packageClassType);
        });
        // For CERTIFICATE type with multiple packages, select the one with max total_sessions
        selectedPackage = this.selectSessionPackage(classType, packageEntities);
      }

      const normalizedWeekdays = this.normalizeWeekdays(
        createClassDto.weekdays,
      );
      const scheduleByWeekday = this.normalizeScheduleByWeekday(
        createClassDto.scheduleByWeekday,
        normalizedWeekdays,
      );

      const defaultSchedule = scheduleByWeekday[normalizedWeekdays[0]];

      const {
        studentIds: _studentIds,
        packageIds: _packageIds,
        scheduleByWeekday: _scheduleByWeekday,
        startDate,
        ...classPayload
      } = createClassDto;

      const classRepository = manager.getRepository(Class);
      const classEntity = classRepository.create({
        ...classPayload,
        startDate: new Date(startDate),
        weekdays: normalizedWeekdays,
        startTime: defaultSchedule.startTime,
        endTime: defaultSchedule.endTime,
        type: classType,
        packageId: selectedPackage?.id ?? null,
        branch,
        teacher,
        scheduleByWeekday: this.toPersistedScheduleByWeekday(scheduleByWeekday),
      });

      const savedClass = await classRepository.save(classEntity);

      // Create ClassPackage relations
      if (packageIds.length > 0) {
        await this.syncClassPackages(manager, savedClass.id, packageIds);
      }

      // Create sessions based on selected package
      await this.createSessionsForClass(
        savedClass,
        selectedPackage,
        scheduleByWeekday,
        manager,
      );

      if (studentIds.length > 0) {
        await this.ensureStudentsExist(studentIds, manager);
        await this.syncClassStudents(manager, savedClass.id, studentIds);
      }

      const createdClass = await this.findClassWithRelations(
        savedClass.id,
        manager,
      );
      return this.toClassResponse(createdClass);
    });
  }

  async findAll(query: QueryClassDto, user: AuthenticatedUser) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);
    const search = query.search?.trim();
    const isTeacher = user.role === UserRole.TEACHER;

    const queryBuilder = this.classRepository
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.branch', 'branch')
      .leftJoinAndSelect('class.teacher', 'teacher')
      .orderBy('class.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (isTeacher) {
      queryBuilder.where('class.teacherId = :teacherId', {
        teacherId: user.sub,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        new Brackets((builder) => {
          builder
            .where('class.name LIKE :search', { search: `%${search}%` })
            .orWhere('branch.name LIKE :search', { search: `%${search}%` })
            .orWhere('teacher.name LIKE :search', { search: `%${search}%` });
        }),
      );
    }

    if (query.status) {
      queryBuilder.andWhere('class.status = :status', {
        status: query.status,
      });
    }

    if (query.branchId) {
      const branchId = Number(query.branchId);
      if (!Number.isInteger(branchId) || branchId < 1) {
        throw new BadRequestException('branchId must be a positive integer');
      }
      queryBuilder.andWhere('class.branchId = :branchId', { branchId });
    }

    if (query.teacherId) {
      const teacherId = Number(query.teacherId);
      if (!Number.isInteger(teacherId) || teacherId < 1) {
        throw new BadRequestException('teacherId must be a positive integer');
      }
      queryBuilder.andWhere('class.teacherId = :teacherId', { teacherId });
    }

    if (query.packageId) {
      const packageId = Number(query.packageId);
      if (!Number.isInteger(packageId) || packageId < 1) {
        throw new BadRequestException('packageId must be a positive integer');
      }
      queryBuilder.andWhere(
        `EXISTS ${queryBuilder
          .subQuery()
          .select('1')
          .from(ClassPackage, 'classPackage')
          .where('classPackage.classId = class.id')
          .andWhere('classPackage.packageId = :packageId')
          .andWhere('classPackage.deletedAt IS NULL')
          .getQuery()}`,
        { packageId },
      );
    }

    if (query.type) {
      queryBuilder.andWhere('class.type = :type', {
        type: query.type,
      });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    const itemIds = items.map((item) => item.id);
    const itemsWithStudents =
      itemIds.length > 0 ? await this.findManyByIdsWithRelations(itemIds) : [];
    const itemMap = new Map(itemsWithStudents.map((item) => [item.id, item]));
    const orderedItems = itemIds
      .map((id) => itemMap.get(id))
      .filter((item): item is Class => item !== undefined)
      .map((item) => this.toClassResponse(item));

    return {
      items: orderedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async findAllTrash(query: BaseQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);

    const queryBuilder = this.classRepository
      .createQueryBuilder('class')
      .withDeleted()
      .where('class.deletedAt IS NOT NULL')
      .leftJoin('class.branch', 'branch')
      .select(['class.id', 'class.name', 'class.deletedAt', 'branch.name'])
      .orderBy('class.deletedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

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
    const classEntity = await this.findClassWithRelations(id);
    return this.toClassResponse(classEntity);
  }

  async update(id: number, updateClassDto: UpdateClassDto) {
    const classEntity = await this.findClassWithRelations(id);
    const { studentIds, packageIds, scheduleByWeekday, ...updatePayload } =
      updateClassDto;
    const scheduleRelevantChanged =
      updateClassDto.weekdays !== undefined ||
      updateClassDto.scheduleByWeekday !== undefined ||
      updateClassDto.packageIds !== undefined ||
      updateClassDto.type !== undefined;
    const normalizedStudentIds =
      studentIds === undefined
        ? undefined
        : this.normalizeStudentIds(studentIds);
    const normalizedPackageIds =
      packageIds === undefined
        ? undefined
        : this.normalizePackageIds(packageIds);

    let effectivePackages =
      classEntity.classPackages?.map((classPackage) => classPackage.package) ??
      [];

    if (normalizedPackageIds !== undefined) {
      effectivePackages = await this.ensurePackagesExist(normalizedPackageIds);
    }

    if (updateClassDto.branchId !== undefined) {
      classEntity.branch = await this.ensureBranchExists(
        updateClassDto.branchId,
      );
    }

    if (updateClassDto.teacherId !== undefined) {
      classEntity.teacher = await this.ensureTeacherExists(
        updateClassDto.teacherId,
      );
    }
    const nextType = updateClassDto.type ?? classEntity.type;
    effectivePackages.forEach((pkg) => {
      const packageClassType = this.toClassType(pkg.type);
      this.ensureClassTypeMatchesPackageType(nextType, packageClassType);
    });
    const selectedPackage = this.selectSessionPackage(
      nextType,
      effectivePackages,
    );
    classEntity.packageId = selectedPackage?.id ?? null;

    const nextWeekdays = this.normalizeWeekdays(
      updateClassDto.weekdays ?? classEntity.weekdays,
    );
    const effectiveScheduleByWeekday = this.resolveScheduleByWeekdayForUpdate(
      classEntity,
      nextWeekdays,
      scheduleByWeekday,
      scheduleRelevantChanged,
    );

    const defaultSchedule = effectiveScheduleByWeekday[nextWeekdays[0]];
    classEntity.startTime = defaultSchedule.startTime;
    classEntity.endTime = defaultSchedule.endTime;
    classEntity.weekdays = nextWeekdays;
    classEntity.scheduleByWeekday = this.toPersistedScheduleByWeekday(
      effectiveScheduleByWeekday,
    );

    Object.assign(classEntity, updatePayload);

    return this.classRepository.manager.transaction(async (manager) => {
      const classRepository = manager.getRepository(Class);
      await classRepository.save(classEntity);

      if (normalizedPackageIds !== undefined) {
        await this.syncClassPackages(manager, id, normalizedPackageIds);
      }

      if (scheduleRelevantChanged) {
        await this.regenerateFutureSessions(
          classEntity,
          selectedPackage,
          effectiveScheduleByWeekday,
          manager,
        );
      }

      if (normalizedStudentIds !== undefined) {
        await this.ensureStudentsExist(normalizedStudentIds, manager);
        await this.syncClassStudents(manager, id, normalizedStudentIds);
      }

      const updatedClass = await this.findClassWithRelations(id, manager);
      return this.toClassResponse(updatedClass);
    });
  }

  async remove(id: number) {
    return this.classRepository.manager.transaction(async (manager) => {
      const classEntity = await this.findClassWithRelations(id, manager);
      const classRepository = manager.getRepository(Class);
      const sessionRepository = manager.getRepository(Session);
      const classStudentRepository = manager.getRepository(ClassStudent);
      const classPackageRepository = manager.getRepository(ClassPackage);
      const attendanceRepository = manager.getRepository(Attendance);

      const sessions = await sessionRepository.find({
        where: { classId: id },
        select: ['id'],
      });
      const sessionIds = sessions.map((session) => session.id);

      await classStudentRepository.softDelete({ classId: id });
      await classPackageRepository.softDelete({ classId: id });

      if (sessionIds.length > 0) {
        await attendanceRepository.softDelete({
          sessionId: In(sessionIds),
        });
      }

      await sessionRepository.softDelete({ classId: id });
      await classRepository.softRemove(classEntity);

      return {
        message: 'Class deleted successfully',
        id,
      };
    });
  }

  async forceRemove(id: number) {
    return this.classRepository.manager.transaction(async (manager) => {
      const classRepository = manager.getRepository(Class);
      const sessionRepository = manager.getRepository(Session);
      const classStudentRepository = manager.getRepository(ClassStudent);
      const classPackageRepository = manager.getRepository(ClassPackage);
      const attendanceRepository = manager.getRepository(Attendance);

      const sessions = await sessionRepository.find({
        where: { classId: id },
        withDeleted: true,
        select: ['id'],
      });
      const sessionIds = sessions.map((session) => session.id);

      await classStudentRepository.delete({ classId: id });
      await classPackageRepository.delete({ classId: id });

      if (sessionIds.length > 0) {
        await attendanceRepository.delete({
          sessionId: In(sessionIds),
        });
      }

      await sessionRepository.delete({ classId: id });
      await classRepository.delete(id);

      return {
        message: 'Class permanently deleted successfully',
        id,
      };
    });
  }

  async restore(id: number) {
    return this.classRepository.manager.transaction(async (manager) => {
      const classRepository = manager.getRepository(Class);
      const sessionRepository = manager.getRepository(Session);
      const classStudentRepository = manager.getRepository(ClassStudent);
      const classPackageRepository = manager.getRepository(ClassPackage);
      const attendanceRepository = manager.getRepository(Attendance);

      const classEntity = await classRepository.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!classEntity) {
        throw new NotFoundException(`Class with id ${id} not found`);
      }

      if (!classEntity.deletedAt) {
        throw new BadRequestException(`Class with id ${id} is not deleted`);
      }

      // 👉 lấy sessionIds trước
      const sessions = await sessionRepository.find({
        where: { classId: id },
        withDeleted: true,
        select: ['id'],
      });

      const sessionIds = sessions.map((s) => s.id);

      await Promise.all([
        classRepository.restore(id),
        classStudentRepository.restore({ classId: id }),
        classPackageRepository.restore({ classId: id }),
        sessionRepository.restore({ classId: id }),
      ]);

      if (sessionIds.length > 0) {
        await attendanceRepository.restore({
          sessionId: In(sessionIds),
        });
      }

      return {
        message: 'Class restored successfully',
        id,
      };
    });
  }

  private async ensureBranchExists(
    branchId: number,
    manager?: EntityManager,
  ): Promise<Branch> {
    const branchRepository =
      manager?.getRepository(Branch) ?? this.branchRepository;
    const branch = await branchRepository.findOne({
      where: { id: branchId },
    });

    if (!branch) {
      throw new BadRequestException(`Invalid branchId: ${branchId}`);
    }

    return branch;
  }

  private async ensureTeacherExists(
    teacherId: number,
    manager?: EntityManager,
  ): Promise<User> {
    const userRepository = manager?.getRepository(User) ?? this.userRepository;
    const teacher = await userRepository.findOne({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new BadRequestException(`Invalid teacherId: ${teacherId}`);
    }

    if (teacher.role !== UserRole.TEACHER) {
      throw new BadRequestException(`User ${teacherId} is not a teacher`);
    }

    return teacher;
  }

  private async ensurePackageExists(
    packageId: number,
    manager?: EntityManager,
  ): Promise<Package> {
    const packageRepository =
      manager?.getRepository(Package) ?? this.packageRepository;
    const packageEntity = await packageRepository.findOne({
      where: { id: packageId },
    });

    if (!packageEntity) {
      throw new BadRequestException(`Invalid packageId: ${packageId}`);
    }

    return packageEntity;
  }

  private ensureClassTypeMatchesPackageType(
    classType: ClassType,
    packageType: ClassType,
  ) {
    if (classType !== packageType) {
      throw new BadRequestException('class type must match package type');
    }
  }

  private toClassType(packageType: PackageType): ClassType {
    switch (packageType) {
      case PackageType.CERTIFICATE:
        return ClassType.CERTIFICATE;
      case PackageType.GENERAL:
        return ClassType.GENERAL;
      case PackageType.SCHOOL_SUBJECT:
        return ClassType.SCHOOL_SUBJECT;
      default:
        throw new BadRequestException(
          `Unsupported package type: ${packageType}`,
        );
    }
  }

  private normalizeStudentIds(studentIds?: number[]): number[] {
    if (!studentIds || studentIds.length === 0) {
      return [];
    }

    return [...new Set(studentIds)];
  }

  private normalizePackageIds(packageIds?: number[]): number[] {
    if (!packageIds || packageIds.length === 0) {
      return [];
    }

    return [...new Set(packageIds)];
  }

  private async ensurePackagesExist(
    packageIds: number[],
    manager?: EntityManager,
  ): Promise<Package[]> {
    if (packageIds.length === 0) {
      return [];
    }

    const packageRepository =
      manager?.getRepository(Package) ?? this.packageRepository;
    const packages = await packageRepository.find({
      where: { id: In(packageIds) },
    });

    const foundIds = new Set(packages.map((pkg) => pkg.id));
    const missingIds = packageIds.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Invalid packageIds: ${missingIds.join(', ')}`,
      );
    }

    return packages;
  }

  private selectSessionPackage(
    classType: ClassType,
    packages: Package[],
  ): Package | null {
    if (packages.length === 0) {
      return null;
    }

    // For CERTIFICATE type, select package with max total_sessions
    if (classType === ClassType.CERTIFICATE) {
      return packages.reduce((max, pkg) => {
        const maxSessions = Number(max.totalSessions ?? 0);
        const pkgSessions = Number(pkg.totalSessions ?? 0);
        return pkgSessions > maxSessions ? pkg : max;
      });
    }

    // For other types, return any package (or null if creating 1-year schedule)
    return packages[0] ?? null;
  }

  private async syncClassPackages(
    manager: EntityManager,
    classId: number,
    packageIds: number[],
  ): Promise<void> {
    const classPackageRepository = manager.getRepository(ClassPackage);

    await classPackageRepository.delete({ classId });

    if (packageIds.length === 0) {
      return;
    }

    const records = packageIds.map((packageId) =>
      classPackageRepository.create({
        classId,
        packageId,
      }),
    );

    await classPackageRepository.save(records);
  }

  private async ensureStudentsExist(
    studentIds: number[],
    manager?: EntityManager,
  ): Promise<void> {
    if (studentIds.length === 0) {
      return;
    }

    const studentRepository =
      manager?.getRepository(Student) ?? this.studentRepository;
    const students = await studentRepository.find({
      where: { id: In(studentIds) },
      select: ['id'],
    });

    const foundIds = new Set(students.map((student) => student.id));
    const missingIds = studentIds.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Invalid studentIds: ${missingIds.join(', ')}`,
      );
    }
  }

  private async syncClassStudents(
    manager: EntityManager,
    classId: number,
    studentIds: number[],
  ): Promise<void> {
    const classStudentRepository = manager.getRepository(ClassStudent);

    await classStudentRepository.delete({ classId });

    if (studentIds.length === 0) {
      return;
    }

    const records = studentIds.map((studentId) =>
      classStudentRepository.create({
        classId,
        studentId,
      }),
    );

    await classStudentRepository.save(records);
  }

  private async createSessionsForClass(
    classEntity: Class,
    packageEntity: Package | null,
    scheduleByWeekday: ScheduleByWeekday,
    manager: EntityManager,
  ): Promise<void> {
    const sessionDates = this.generateSessionDates(classEntity, packageEntity);

    if (sessionDates.length === 0) {
      return;
    }

    const sessionRepository = manager.getRepository(Session);
    const sessions = sessionDates.map((sessionDate) => {
      const schedule = scheduleByWeekday[sessionDate.getDay()];

      if (!schedule) {
        throw new BadRequestException(
          `Missing schedule for weekday ${sessionDate.getDay()}`,
        );
      }

      return {
        classId: classEntity.id,
        sessionDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      };
    });

    await sessionRepository.insert(sessions);
  }

  private async regenerateFutureSessions(
    classEntity: Class,
    packageEntity: Package | null,
    scheduleByWeekday: ScheduleByWeekday,
    manager: EntityManager,
  ): Promise<void> {
    const sessionRepository = manager.getRepository(Session);

    const effectiveFrom = this.toStartOfDay(new Date());
    const effectiveFromDateOnly = this.toDateOnlyString(effectiveFrom);

    const preservedPastSessionCount = await sessionRepository
      .createQueryBuilder('session')
      .where('session.classId = :classId', { classId: classEntity.id })
      .andWhere('session.sessionDate < :effectiveFrom', {
        effectiveFrom: effectiveFromDateOnly,
      })
      .getCount();

    await sessionRepository
      .createQueryBuilder()
      .delete()
      .from(Session)
      .where('class_id = :classId', { classId: classEntity.id })
      .andWhere('session_date >= :effectiveFrom', {
        effectiveFrom: effectiveFromDateOnly,
      })
      .execute();

    const newFutureDates = this.generateFutureSessionDates(
      classEntity,
      packageEntity,
      effectiveFrom,
      preservedPastSessionCount,
    );

    if (newFutureDates.length === 0) {
      return;
    }

    const newFutureSessions = newFutureDates.map((sessionDate) => {
      const schedule = scheduleByWeekday[sessionDate.getDay()];

      if (!schedule) {
        throw new BadRequestException(
          `Missing schedule for weekday ${sessionDate.getDay()}`,
        );
      }

      return {
        classId: classEntity.id,
        sessionDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      };
    });

    await sessionRepository.insert(newFutureSessions);
  }

  private normalizeWeekdays(weekdays: number[]): number[] {
    const normalized = [...new Set(weekdays)].sort((a, b) => a - b);

    if (normalized.length === 0) {
      throw new BadRequestException('weekdays must contain at least one day');
    }

    if (
      normalized.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
    ) {
      throw new BadRequestException(
        'weekdays must only contain values from 0 to 6',
      );
    }

    return normalized;
  }

  private normalizeScheduleByWeekday(
    scheduleByWeekdayInput: Record<
      string,
      { startTime: string; endTime: string }
    >,
    weekdays: number[],
  ): ScheduleByWeekday {
    if (!scheduleByWeekdayInput || typeof scheduleByWeekdayInput !== 'object') {
      throw new BadRequestException('scheduleByWeekday is required');
    }

    const normalizedSchedule: Partial<ScheduleByWeekday> = {};

    Object.entries(scheduleByWeekdayInput).forEach(([weekdayKey, schedule]) => {
      const weekday = Number(weekdayKey);
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
        throw new BadRequestException(
          `scheduleByWeekday has invalid weekday key: ${weekdayKey}`,
        );
      }

      if (!schedule || typeof schedule !== 'object') {
        throw new BadRequestException(
          `scheduleByWeekday[${weekday}] must be an object`,
        );
      }

      const startTime = schedule.startTime?.trim();
      const endTime = schedule.endTime?.trim();

      if (!startTime || !endTime) {
        throw new BadRequestException(
          `scheduleByWeekday[${weekday}] requires startTime and endTime`,
        );
      }

      this.validateMilitaryTime(
        startTime,
        `scheduleByWeekday[${weekday}].startTime`,
      );
      this.validateMilitaryTime(
        endTime,
        `scheduleByWeekday[${weekday}].endTime`,
      );
      this.validateTimeRange(startTime, endTime);

      normalizedSchedule[weekday] = {
        startTime,
        endTime,
      };
    });

    weekdays.forEach((weekday) => {
      if (!normalizedSchedule[weekday]) {
        throw new BadRequestException(
          `scheduleByWeekday is missing schedule for weekday ${weekday}`,
        );
      }
    });

    return normalizedSchedule as ScheduleByWeekday;
  }

  private toPersistedScheduleByWeekday(
    scheduleByWeekday: ScheduleByWeekday,
  ): Record<string, { startTime: string; endTime: string }> {
    const persistedSchedule: Record<
      string,
      { startTime: string; endTime: string }
    > = {};

    Object.entries(scheduleByWeekday).forEach(([weekday, schedule]) => {
      persistedSchedule[String(weekday)] = {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      };
    });

    return persistedSchedule;
  }

  private resolveScheduleByWeekdayForUpdate(
    classEntity: Class,
    weekdays: number[],
    scheduleByWeekdayInput:
      | Record<string, { startTime: string; endTime: string }>
      | undefined,
    scheduleRelevantChanged: boolean,
  ): ScheduleByWeekday {
    if (scheduleByWeekdayInput) {
      return this.normalizeScheduleByWeekday(scheduleByWeekdayInput, weekdays);
    }

    const scheduleFromExistingSessions = this.extractScheduleFromSessions(
      classEntity.sessions ?? [],
      weekdays,
    );

    const missingWeekdays = weekdays.filter(
      (weekday) => !scheduleFromExistingSessions[weekday],
    );

    if (missingWeekdays.length > 0) {
      if (scheduleRelevantChanged) {
        throw new BadRequestException(
          `scheduleByWeekday is required for weekdays: ${missingWeekdays.join(', ')}`,
        );
      }

      const fallbackStartTime = classEntity.startTime;
      const fallbackEndTime = classEntity.endTime;
      if (!fallbackStartTime || !fallbackEndTime) {
        throw new BadRequestException('scheduleByWeekday is required');
      }

      this.validateMilitaryTime(fallbackStartTime, 'startTime');
      this.validateMilitaryTime(fallbackEndTime, 'endTime');
      this.validateTimeRange(fallbackStartTime, fallbackEndTime);

      missingWeekdays.forEach((weekday) => {
        scheduleFromExistingSessions[weekday] = {
          startTime: fallbackStartTime,
          endTime: fallbackEndTime,
        };
      });
    }

    return scheduleFromExistingSessions;
  }

  private extractScheduleFromSessions(
    sessions: Session[],
    weekdays: number[],
  ): ScheduleByWeekday {
    const scheduleByWeekday: Partial<ScheduleByWeekday> = {};
    const sortedSessions = [...sessions].sort((a, b) => {
      const dateDiff =
        new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return a.startTime.localeCompare(b.startTime);
    });

    sortedSessions.forEach((session) => {
      const weekday = new Date(session.sessionDate).getDay();
      if (scheduleByWeekday[weekday]) {
        return;
      }

      if (!session.startTime || !session.endTime) {
        return;
      }

      scheduleByWeekday[weekday] = {
        startTime: session.startTime,
        endTime: session.endTime,
      };
    });

    const resolved: Partial<ScheduleByWeekday> = {};
    weekdays.forEach((weekday) => {
      if (scheduleByWeekday[weekday]) {
        resolved[weekday] = scheduleByWeekday[weekday];
      }
    });

    return resolved as ScheduleByWeekday;
  }

  private generateFutureSessionDates(
    classEntity: Class,
    packageEntity: Package | null,
    effectiveFrom: Date,
    preservedPastSessionCount: number,
  ): Date[] {
    const startDate = this.toStartOfDay(classEntity.startDate);
    const regenerateFrom =
      effectiveFrom > startDate ? new Date(effectiveFrom) : new Date(startDate);
    const weekdays = [...new Set(classEntity.weekdays)].sort((a, b) => a - b);

    if (weekdays.length === 0) {
      throw new BadRequestException('weekdays must contain at least one day');
    }

    if (classEntity.type === ClassType.CERTIFICATE && packageEntity) {
      const totalSessions = Number(packageEntity.totalSessions ?? 0);
      if (!Number.isInteger(totalSessions) || totalSessions <= 0) {
        throw new BadRequestException(
          'Certificate class requires package.totalSessions greater than 0',
        );
      }

      const remainingSessions = Math.max(
        totalSessions - preservedPastSessionCount,
        0,
      );
      return this.collectMatchingDatesByCount(
        regenerateFrom,
        weekdays,
        remainingSessions,
      );
    }

    const classEndDateExclusive = new Date(startDate);
    classEndDateExclusive.setFullYear(classEndDateExclusive.getFullYear() + 1);

    if (regenerateFrom >= classEndDateExclusive) {
      return [];
    }

    return this.collectMatchingDatesByRange(
      regenerateFrom,
      classEndDateExclusive,
      weekdays,
    );
  }

  private generateSessionDates(
    classEntity: Class,
    packageEntity: Package | null,
  ): Date[] {
    const weekdays = [...new Set(classEntity.weekdays)].sort((a, b) => a - b);

    if (weekdays.length === 0) {
      throw new BadRequestException('weekdays must contain at least one day');
    }

    const startDate = this.toStartOfDay(classEntity.startDate);

    if (classEntity.type === ClassType.CERTIFICATE && packageEntity) {
      const totalSessions = Number(packageEntity.totalSessions ?? 0);
      if (!Number.isInteger(totalSessions) || totalSessions <= 0) {
        throw new BadRequestException(
          'Certificate class requires package.totalSessions greater than 0',
        );
      }

      return this.collectMatchingDatesByCount(
        startDate,
        weekdays,
        totalSessions,
      );
    }

    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    return this.collectMatchingDatesByRange(startDate, endDate, weekdays);
  }

  private collectMatchingDatesByCount(
    startDate: Date,
    weekdays: number[],
    targetCount: number,
  ): Date[] {
    const result: Date[] = [];
    const cursor = new Date(startDate);

    while (result.length < targetCount) {
      if (weekdays.includes(cursor.getDay())) {
        result.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }

  private collectMatchingDatesByRange(
    startDate: Date,
    endDateExclusive: Date,
    weekdays: number[],
  ): Date[] {
    const result: Date[] = [];
    const cursor = new Date(startDate);

    while (cursor < endDateExclusive) {
      if (weekdays.includes(cursor.getDay())) {
        result.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }

  private toStartOfDay(dateInput: Date | string): Date {
    if (dateInput instanceof Date) {
      if (Number.isNaN(dateInput.getTime())) {
        throw new BadRequestException('Invalid date input');
      }

      return new Date(
        dateInput.getFullYear(),
        dateInput.getMonth(),
        dateInput.getDate(),
      );
    }

    if (typeof dateInput === 'string') {
      const trimmed = dateInput.trim();
      const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);

      if (dateOnlyMatch) {
        const year = Number(dateOnlyMatch[1]);
        const month = Number(dateOnlyMatch[2]);
        const day = Number(dateOnlyMatch[3]);
        return new Date(year, month - 1, day);
      }

      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return new Date(
          parsed.getFullYear(),
          parsed.getMonth(),
          parsed.getDate(),
        );
      }
    }

    throw new BadRequestException('Invalid date input');
  }

  private toDateOnlyString(dateInput: Date): string {
    const year = dateInput.getFullYear();
    const month = `${dateInput.getMonth() + 1}`.padStart(2, '0');
    const day = `${dateInput.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private validateTimeRange(startTime: string, endTime: string): void {
    const startMinutes = this.parseTimeToMinutes(startTime);
    const endMinutes = this.parseTimeToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      throw new BadRequestException('endTime must be greater than startTime');
    }
  }

  private validateMilitaryTime(value: string, fieldName: string): void {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!regex.test(value)) {
      throw new BadRequestException(`${fieldName} must be in HH:mm format`);
    }
  }

  private parseTimeToMinutes(time: string): number {
    const [hourStr, minuteStr] = time.split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);

    return hour * 60 + minute;
  }

  private async findClassWithRelations(
    id: number,
    manager?: EntityManager,
  ): Promise<Class> {
    const classRepository =
      manager?.getRepository(Class) ?? this.classRepository;
    const classEntity = await classRepository.findOne({
      where: { id },
      relations: [
        'branch',
        'teacher',
        'classPackages',
        'classPackages.package',
        'sessions',
        'classStudents',
        'classStudents.student',
      ],
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with id ${id} not found`);
    }

    return classEntity;
  }

  private async findManyByIdsWithRelations(ids: number[]): Promise<Class[]> {
    return this.classRepository.find({
      where: { id: In(ids) },
      relations: [
        'branch',
        'teacher',
        'classPackages',
        'classPackages.package',
        'sessions',
        'classStudents',
        'classStudents.student',
      ],
    });
  }

  private toClassResponse(classEntity: Class): Omit<
    Class,
    'classStudents' | 'classPackages' | 'sessions'
  > & {
    students: Student[];
    studentIds: number[];
    packages: Package[];
    packageIds: number[];
  } {
    const students = (classEntity.classStudents ?? [])
      .map((classStudent) => classStudent.student)
      .filter((student): student is Student => Boolean(student));

    const packages = (classEntity.classPackages ?? [])
      .map((classPackage) => classPackage.package)
      .filter((packageEntity): packageEntity is Package =>
        Boolean(packageEntity),
      );

    const studentIds = students.map((student) => student.id);
    const packageIds = packages.map((packageEntity) => packageEntity.id);

    const {
      classStudents: _classStudents,
      classPackages: _classPackages,
      sessions: _sessions,
      ...classData
    } = classEntity;

    return {
      ...classData,
      students,
      studentIds,
      packages,
      packageIds,
    };
  }
}
