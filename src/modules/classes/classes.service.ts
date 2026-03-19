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
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { QueryClassDto } from './dto/query-class.dto';

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

    return this.classRepository.manager.transaction(async (manager) => {
      const [branch, teacher, packageEntity] = await Promise.all([
        this.ensureBranchExists(createClassDto.branchId, manager),
        this.ensureTeacherExists(createClassDto.teacherId, manager),
        this.ensurePackageExists(createClassDto.packageId, manager),
      ]);

      const packageClassType = this.toClassType(packageEntity.type);
      const classType = createClassDto.type ?? packageClassType;
      this.ensureClassTypeMatchesPackageType(classType, packageClassType);
      this.validateTimeRange(createClassDto.startTime, createClassDto.endTime);

      const {
        studentIds: _studentIds,
        startTime,
        endTime,
        startDate,
        ...classPayload
      } = createClassDto;

      const classRepository = manager.getRepository(Class);
      const classEntity = classRepository.create({
        ...classPayload,
        startDate: new Date(startDate),
        startTime,
        endTime,
        type: classType,
        branch,
        teacher,
        package: packageEntity,
      });

      const savedClass = await classRepository.save(classEntity);

      await this.createSessionsForClass(savedClass, packageEntity, manager);

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

  async findAll(query: QueryClassDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);
    const search = query.search?.trim();

    const queryBuilder = this.classRepository
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.branch', 'branch')
      .leftJoinAndSelect('class.teacher', 'teacher')
      .leftJoinAndSelect('class.package', 'package')
      .orderBy('class.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        new Brackets((builder) => {
          builder
            .where('class.name LIKE :search', { search: `%${search}%` })
            .orWhere('branch.name LIKE :search', { search: `%${search}%` })
            .orWhere('teacher.name LIKE :search', { search: `%${search}%` })
            .orWhere('package.name LIKE :search', { search: `%${search}%` });
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
      queryBuilder.andWhere('class.packageId = :packageId', { packageId });
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

  async findOne(id: number) {
    const classEntity = await this.findClassWithRelations(id);
    return this.toClassResponse(classEntity);
  }

  async update(id: number, updateClassDto: UpdateClassDto) {
    const classEntity = await this.findClassWithRelations(id);
    const { studentIds, ...updatePayload } = updateClassDto;
    const scheduleRelevantChanged =
      updateClassDto.weekdays !== undefined ||
      updateClassDto.startTime !== undefined ||
      updateClassDto.endTime !== undefined ||
      updateClassDto.packageId !== undefined ||
      updateClassDto.type !== undefined;
    const normalizedStudentIds =
      studentIds === undefined
        ? undefined
        : this.normalizeStudentIds(studentIds);

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

    let packageType: ClassType | undefined;
    if (updateClassDto.packageId !== undefined) {
      const packageEntity = await this.ensurePackageExists(
        updateClassDto.packageId,
      );
      classEntity.package = packageEntity;
      packageType = this.toClassType(packageEntity.type);
    }

    const nextType = updateClassDto.type ?? classEntity.type;
    const effectivePackageType =
      packageType ??
      (classEntity.package
        ? this.toClassType(classEntity.package.type)
        : undefined);
    if (effectivePackageType) {
      this.ensureClassTypeMatchesPackageType(nextType, effectivePackageType);
    }

    const nextStartTime = updateClassDto.startTime ?? classEntity.startTime;
    const nextEndTime = updateClassDto.endTime ?? classEntity.endTime;
    if (nextStartTime && nextEndTime) {
      this.validateTimeRange(nextStartTime, nextEndTime);
    } else if (scheduleRelevantChanged) {
      throw new BadRequestException(
        'Class startTime and endTime are required to regenerate schedule',
      );
    }

    Object.assign(classEntity, updatePayload);

    return this.classRepository.manager.transaction(async (manager) => {
      const classRepository = manager.getRepository(Class);
      await classRepository.save(classEntity);

      if (scheduleRelevantChanged) {
        await this.regenerateFutureSessions(classEntity, manager);
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
    const classEntity = await this.findOne(id);
    await this.classRepository.remove(classEntity);

    return {
      message: 'Class deleted successfully',
      id,
    };
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
    packageEntity: Package,
    manager: EntityManager,
  ): Promise<void> {
    if (!classEntity.startTime || !classEntity.endTime) {
      throw new BadRequestException('Class startTime and endTime are required');
    }
    const classStartTime = classEntity.startTime;
    const classEndTime = classEntity.endTime;

    const sessionDates = this.generateSessionDates(classEntity, packageEntity);

    if (sessionDates.length === 0) {
      return;
    }

    const sessionRepository = manager.getRepository(Session);
    const sessions = sessionDates.map((sessionDate) => ({
      classId: classEntity.id,
      sessionDate,
      startTime: classStartTime,
      endTime: classEndTime,
    }));

    await sessionRepository.insert(sessions);
  }

  private async regenerateFutureSessions(
    classEntity: Class,
    manager: EntityManager,
  ): Promise<void> {
    if (!classEntity.startTime || !classEntity.endTime) {
      throw new BadRequestException('Class startTime and endTime are required');
    }
    const classStartTime = classEntity.startTime;
    const classEndTime = classEntity.endTime;

    const sessionRepository = manager.getRepository(Session);
    const packageRepository = manager.getRepository(Package);
    const packageEntity = await packageRepository.findOne({
      where: { id: classEntity.packageId },
    });

    if (!packageEntity) {
      throw new BadRequestException(
        `Invalid packageId: ${classEntity.packageId}`,
      );
    }

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

    const newFutureSessions = newFutureDates.map((sessionDate) => ({
      classId: classEntity.id,
      sessionDate,
      startTime: classStartTime,
      endTime: classEndTime,
    }));

    await sessionRepository.insert(newFutureSessions);
  }

  private generateFutureSessionDates(
    classEntity: Class,
    packageEntity: Package,
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

    if (classEntity.type === ClassType.CERTIFICATE) {
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
    packageEntity: Package,
  ): Date[] {
    const weekdays = [...new Set(classEntity.weekdays)].sort((a, b) => a - b);

    if (weekdays.length === 0) {
      throw new BadRequestException('weekdays must contain at least one day');
    }

    const startDate = this.toStartOfDay(classEntity.startDate);

    if (classEntity.type === ClassType.CERTIFICATE) {
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
        'package',
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
        'package',
        'sessions',
        'classStudents',
        'classStudents.student',
      ],
    });
  }

  private toClassResponse(classEntity: Class): Class & { students: Student[] } {
    const students = (classEntity.classStudents ?? [])
      .map((classStudent) => classStudent.student)
      .filter((student): student is Student => Boolean(student));

    return {
      ...classEntity,
      students,
    };
  }
}
