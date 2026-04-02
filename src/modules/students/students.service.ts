import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, In, Repository } from 'typeorm';
import { Student } from '@/database/entities/student.entity';
import { Branch } from '@/database/entities/branch.entity';
import { Parent } from '@/database/entities/parent.entity';
import { Package } from '@/database/entities/package.entity';
import { Enrollment } from '@/database/entities/enrollment.entity';
import {
  Attendance,
  AttendanceStatus,
} from '@/database/entities/attendance.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { StudentParentDto } from './dto/student-parent.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { RenewStudentCourseDto } from './dto/renew-student-course.dto';
import { QueryStudentAttendanceDto } from './dto/query-student-attendance.dto';
import { QueryStudentsByEnrollmentsDto } from './dto/query-students-by-enrollments.dto';
import { CycleDto } from './dto/cycle.dto';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { ClassStudent } from '@/database/entities/class_student.entity';
import { Session } from '@/database/entities/session.entity';
import { Class } from '@/database/entities/class.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(Package)
    private readonly packageRepository: Repository<Package>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(ClassStudent)
    private readonly classStudentRepository: Repository<ClassStudent>,
  ) {}

  async create(createStudentDto: CreateStudentDto) {
    const normalizedPackageIds = this.normalizeIds(createStudentDto.packageIds);

    if (normalizedPackageIds.length === 0) {
      throw new BadRequestException(
        'packageIds must contain at least one package id',
      );
    }

    return this.studentRepository.manager.transaction(async (manager) => {
      const branch =
        createStudentDto.branchId !== undefined
          ? await this.ensureBranchExists(createStudentDto.branchId, manager)
          : null;

      const packages = await this.ensurePackagesExist(
        normalizedPackageIds,
        manager,
      );

      const parents = await this.resolveParents(
        createStudentDto.parents ?? [],
        manager,
      );

      const studentRepository = manager.getRepository(Student);
      const student = studentRepository.create({
        name: createStudentDto.name,
        addressDetail: createStudentDto.addressDetail,
        provinceCode: createStudentDto.provinceCode,
        wardCode: createStudentDto.wardCode,
        provinceName: createStudentDto.provinceName,
        wardName: createStudentDto.wardName,
        birthday: createStudentDto.birthday,
        phone: createStudentDto.phone,
        branchId: branch ? branch.id : null,
        branch,
        parents,
      });

      const savedStudent = await studentRepository.save(student);
      await this.syncEnrollments(manager, savedStudent.id, packages);

      const createdStudent = await this.findStudentEntityById(
        savedStudent.id,
        manager,
      );
      return this.buildStudentProfile(createdStudent);
    });
  }

  async findAll(query: QueryStudentDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);
    const search = query.search?.trim();

    const queryBuilder = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.branch', 'branch')
      .leftJoinAndSelect('student.parents', 'parent')
      .leftJoinAndSelect('student.enrollments', 'enrollment')
      .leftJoinAndSelect('enrollment.package', 'package')
      .leftJoinAndSelect('student.classStudents', 'classStudents')
      .leftJoinAndSelect('classStudents.classEntity', 'classEntity')
      .distinct(true)
      .orderBy('student.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        new Brackets((builder) => {
          builder
            .where('student.name LIKE :search', { search: `%${search}%` })
            .orWhere('student.phone LIKE :search', { search: `%${search}%` })
            .orWhere('student.birthday LIKE :search', { search: `%${search}%` })
            .orWhere('parent.name LIKE :search', { search: `%${search}%` });
        }),
      );
    }

    if (query.branchId) {
      const branchId = Number(query.branchId);
      if (!Number.isInteger(branchId) || branchId < 1) {
        throw new BadRequestException('branchId must be a positive integer');
      }
      queryBuilder.andWhere('student.branchId = :branchId', { branchId });
    }

    if (query.packageId) {
      const packageId = Number(query.packageId);
      if (!Number.isInteger(packageId) || packageId < 1) {
        throw new BadRequestException('packageId must be a positive integer');
      }
      queryBuilder.andWhere('enrollment.packageId = :packageId', { packageId });
    }
    if (query.classId) {
      const classId = Number(query.classId);
      if (!Number.isInteger(classId) || classId < 1) {
        throw new BadRequestException('classId must be a positive integer');
      }
      queryBuilder.andWhere('classStudents.classId = :classId', { classId });
    }

    if (query.isCalled) {
      const isCalled = Number(query.isCalled) === 1;
      queryBuilder.andWhere('student.isCalled = :isCalled', { isCalled });
    }
    if (query.isTexted) {
      const isTexted = Number(query.isTexted) === 1;
      queryBuilder.andWhere('student.isTexted = :isTexted', { isTexted });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    const sessionStats = await this.getStudentSessionStats(
      items.map((student) => student.id),
    );

    return {
      items: items.map((student) =>
        this.buildStudentProfile(student, sessionStats.get(student.id)),
      ),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const student = await this.findStudentEntityById(id);
    const sessionStats = await this.getStudentSessionStats([student.id]);
    return this.buildStudentProfile(student, sessionStats.get(student.id));
  }

  async findAllTrash(query: BaseQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);

    const queryBuilder = this.studentRepository
      .createQueryBuilder('student')
      .withDeleted()
      .where(
        'student.deletedAt IS NOT NULL AND student.deletedBy_branch_id IS NULL',
      )
      .leftJoin('student.branch', 'branch')
      .select([
        'student.id',
        'student.name',
        'student.phone',
        'student.deletedAt',
        'branch.name',
      ])
      .orderBy('student.deletedAt', 'DESC')
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

  async findByEnrollments(query: QueryStudentsByEnrollmentsDto) {
    const branchId = Number(query.branchId);
    if (!Number.isInteger(branchId) || branchId < 1) {
      throw new BadRequestException('branchId must be a positive integer');
    }

    const packageIds = this.parsePackageIdsFromQuery(query.packageIds);
    if (packageIds.length === 0) {
      throw new BadRequestException(
        'packageIds must contain at least one package id',
      );
    }

    await Promise.all([
      this.ensureBranchExists(branchId),
      this.ensurePackagesExist(packageIds),
    ]);

    const search = query.search?.trim();

    const queryBuilder = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.branch', 'branch')
      .leftJoinAndSelect('student.parents', 'parent')
      .leftJoinAndSelect('student.enrollments', 'enrollment')
      .leftJoinAndSelect('enrollment.package', 'package')
      .where('student.branchId = :branchId', { branchId })
      .andWhere('enrollment.packageId IN (:...packageIds)', { packageIds })
      .distinct(true)
      .orderBy('student.id', 'DESC');

    if (search) {
      queryBuilder.andWhere(
        new Brackets((builder) => {
          builder
            .where('student.name LIKE :search', { search: `%${search}%` })
            .orWhere('student.phone LIKE :search', { search: `%${search}%` })
            .orWhere('package.name LIKE :search', { search: `%${search}%` });
        }),
      );
    }

    const items = await queryBuilder.getMany();
    const sessionStats = await this.getStudentSessionStats(
      items.map((student) => student.id),
    );

    return {
      items: items.map((student) =>
        this.buildStudentProfile(student, sessionStats.get(student.id)),
      ),
      total: items.length,
      branchId,
      packageIds,
    };
  }

  async getCycleStudents(query: CycleDto) {
    const classEntity = await this.classRepository.findOne({
      where: { id: query.classId },
      relations: [
        'branch',
        'teacher',
        'classStudents',
        'classStudents.student',
      ],
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with id ${query.classId} not found`);
    }

    let selectedClassStudents = classEntity.classStudents ?? [];

    if (query.studentId) {
      selectedClassStudents = selectedClassStudents.filter(
        (item) => item.studentId === query.studentId,
      );

      if (selectedClassStudents.length === 0) {
        throw new BadRequestException(
          `studentId ${query.studentId} does not belong to class ${query.classId}`,
        );
      }
    }

    const studentIds = selectedClassStudents.map((item) => item.studentId);

    const sessionsQuery = this.sessionRepository
      .createQueryBuilder('session')
      .where('session.classId = :classId', { classId: query.classId })
      .orderBy('session.sessionDate', 'ASC')
      .addOrderBy('session.startTime', 'ASC');

    const sessions = await sessionsQuery.getMany();
    const sessionIds = sessions.map((session) => session.id);

    let attendances: Attendance[] = [];
    if (studentIds.length > 0 && sessionIds.length > 0) {
      attendances = await this.attendanceRepository
        .createQueryBuilder('attendance')
        .leftJoinAndSelect('attendance.session', 'session')
        .where('attendance.studentId IN (:...studentIds)', { studentIds })
        .andWhere('attendance.sessionId IN (:...sessionIds)', { sessionIds })
        .orderBy('session.sessionDate', 'ASC')
        .addOrderBy('session.startTime', 'ASC')
        .getMany();
    }

    const attendanceByStudent = new Map<number, Attendance[]>();
    attendances.forEach((attendance) => {
      const list = attendanceByStudent.get(attendance.studentId) ?? [];
      list.push(attendance);
      attendanceByStudent.set(attendance.studentId, list);
    });

    return {
      class: {
        id: classEntity.id,
        name: classEntity.name,
        status: classEntity.status,
        type: classEntity.type,
        roomName: classEntity.roomName,
        startDate: classEntity.startDate,
        startTime: classEntity.startTime,
        endTime: classEntity.endTime,
        weekdays: classEntity.weekdays,
        scheduleByWeekday: classEntity.scheduleByWeekday,
        branch: classEntity.branch
          ? {
              id: classEntity.branch.id,
              name: classEntity.branch.name,
            }
          : null,
        teacher: classEntity.teacher
          ? {
              id: classEntity.teacher.id,
              name: classEntity.teacher.name,
            }
          : null,
      },
      schedule: sessions,
      students: selectedClassStudents.map((classStudent) => ({
        id: classStudent.student.id,
        name: classStudent.student.name,
        phone: classStudent.student.phone,
        cycleStartDate: classStudent.student.cycleStartDate,
        attendances: attendanceByStudent.get(classStudent.studentId) ?? [],
      })),
      totalSessions: sessions.length,
      totalStudents: selectedClassStudents.length,
    };
  }

  async findAttendances(studentId: number, query: QueryStudentAttendanceDto) {
    await this.findStudentEntityById(studentId);

    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);

    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.session', 'session')
      .leftJoinAndSelect('session.classEntity', 'classEntity')
      .leftJoinAndSelect('classEntity.branch', 'branch')
      .leftJoinAndSelect('classEntity.teacher', 'teacher')
      .leftJoinAndSelect('classEntity.classPackages', 'classPackages')
      .leftJoinAndSelect('classPackages.package', 'package')
      .where('attendance.studentId = :studentId', { studentId })
      .orderBy('session.sessionDate', 'DESC')
      .addOrderBy('session.startTime', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.classId) {
      const classId = Number(query.classId);
      if (!Number.isInteger(classId) || classId < 1) {
        throw new BadRequestException('classId must be a positive integer');
      }
      queryBuilder.andWhere('session.classId = :classId', { classId });
    }

    if (query.status) {
      queryBuilder.andWhere('attendance.status = :status', {
        status: query.status,
      });
    }

    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['classStudents', 'classStudents.classEntity'],
    });

    const studentClass = student?.classStudents?.map((item) => {
      return {
        id: item.classEntity.id,
        name: item.classEntity.name,
      };
    });

    const [items, total] = await queryBuilder.getManyAndCount();

    const normalizedItems = items.map((attendance) =>
      this.normalizeAttendanceResponse(attendance),
    );

    return {
      items: normalizedItems,
      studentClass,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async updateCycleStartDate(id: number, cycleStartDate: Date | null) {
    const student = await this.findStudentEntityById(id);
    student.cycleStartDate = cycleStartDate;
    await this.studentRepository.save(student);
    return {
      message: `Student cycleStartDate updated to ${cycleStartDate}`,
      id,
    };
  }

  async updateIsCalled(id: number, isCalled: boolean) {
    const student = await this.findStudentEntityById(id);
    student.isCalled = isCalled;
    await this.studentRepository.save(student);
    return {
      message: `Student isCalled updated to ${isCalled}`,
      id,
    };
  }
  async updateIsTexted(id: number, isTexted: boolean) {
    const student = await this.findStudentEntityById(id);
    student.isTexted = isTexted;
    await this.studentRepository.save(student);
    return {
      message: `Student isTexted updated to ${isTexted}`,
      id,
    };
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    return this.studentRepository.manager.transaction(async (manager) => {
      const student = await this.findStudentEntityById(id, manager);

      if (updateStudentDto.name !== undefined) {
        student.name = updateStudentDto.name;
      }
      if (updateStudentDto.addressDetail !== undefined) {
        student.addressDetail = updateStudentDto.addressDetail;
      }
      if (updateStudentDto.provinceCode !== undefined) {
        student.provinceCode = updateStudentDto.provinceCode;
      }
      if (updateStudentDto.wardCode !== undefined) {
        student.wardCode = updateStudentDto.wardCode;
      }
      if (updateStudentDto.provinceName !== undefined) {
        student.provinceName = updateStudentDto.provinceName;
      }
      if (updateStudentDto.wardName !== undefined) {
        student.wardName = updateStudentDto.wardName;
      }

      if (updateStudentDto.phone !== undefined) {
        student.phone = updateStudentDto.phone;
      }

      if (updateStudentDto.birthday !== undefined) {
        student.birthday = updateStudentDto.birthday;
      }

      if (updateStudentDto.branchId !== undefined) {
        const branch = await this.ensureBranchExists(
          updateStudentDto.branchId,
          manager,
        );
        student.branch = branch;
        student.branchId = branch.id;
      }

      if (updateStudentDto.parents !== undefined) {
        student.parents = await this.resolveParents(
          updateStudentDto.parents,
          manager,
        );
      }

      const studentRepository = manager.getRepository(Student);
      await studentRepository.save(student);

      const updatedStudent = await this.findStudentEntityById(
        student.id,
        manager,
      );
      return this.buildStudentProfile(updatedStudent);
    });
  }

  async renewCourse(id: number, renewStudentCourseDto: RenewStudentCourseDto) {
    const normalizedPackageIds = this.normalizeIds(
      renewStudentCourseDto.packageIds,
    );

    if (normalizedPackageIds.length === 0) {
      throw new BadRequestException(
        'packageIds must contain at least one package id',
      );
    }

    return this.studentRepository.manager.transaction(async (manager) => {
      await this.findStudentEntityById(id, manager);
      const packages = await this.ensurePackagesExist(
        normalizedPackageIds,
        manager,
      );

      await this.appendEnrollments(manager, id, packages);

      const updatedStudent = await this.findStudentEntityById(id, manager);
      return this.buildStudentProfile(updatedStudent);
    });
  }

  async remove(id: number) {
    return this.studentRepository.manager.transaction(async (manager) => {
      const student = await this.findStudentEntityById(id, manager);

      await this.softDeleteStudentRelations(manager, student.id);
      await manager.getRepository(Student).softDelete(student.id);

      return {
        message: 'Student deleted successfully',
        id,
      };
    });
  }
  async restore(id: number) {
    return this.studentRepository.manager.transaction(async (manager) => {
      const student = await manager.getRepository(Student).findOne({
        where: { id },
        withDeleted: true,
      });
      if (!student || !student.deletedAt) {
        throw new NotFoundException(`Student with id ${id} not found in trash`);
      }

      await this.restoreStudentRelations(manager, student.id);
      await manager.getRepository(Student).restore(student.id);
      return {
        message: 'Student restored successfully',
        id,
      };
    });
  }

  async forceRemove(id: number) {
    return this.studentRepository.manager.transaction(async (manager) => {
      const student = await manager.getRepository(Student).findOne({
        where: { id },
        withDeleted: true,
      });
      if (!student) {
        throw new NotFoundException(`Student with id ${id} not found`);
      }

      await this.forceDeleteStudentRelations(manager, student.id);
      await manager.getRepository(Student).delete(student.id);

      return {
        message: 'Student permanently deleted successfully',
        id,
      };
    });
  }

  private async findStudentEntityById(
    id: number,
    manager?: EntityManager,
  ): Promise<Student> {
    const studentRepository =
      manager?.getRepository(Student) ?? this.studentRepository;

    const student = await studentRepository.findOne({
      where: { id },
      relations: ['branch', 'parents', 'enrollments', 'enrollments.package'],
    });

    if (!student) {
      throw new NotFoundException(`Student with id ${id} not found`);
    }

    return student;
  }
  private async softDeleteStudentRelations(
    manager: EntityManager,
    studentId: number,
  ) {
    await manager.getRepository(Attendance).softDelete({ studentId });
    await manager.getRepository(Enrollment).softDelete({ studentId });
    await manager.getRepository(ClassStudent).softDelete({ studentId });
  }

  private async restoreStudentRelations(
    manager: EntityManager,
    studentId: number,
  ) {
    await manager.getRepository(Attendance).restore({ studentId });
    await manager.getRepository(Enrollment).restore({ studentId });
    await manager.getRepository(ClassStudent).restore({ studentId });
  }

  private async forceDeleteStudentRelations(
    manager: EntityManager,
    studentId: number,
  ) {
    await manager.getRepository(Attendance).delete({ studentId });
    await manager.getRepository(Enrollment).delete({ studentId });
    await manager.getRepository(ClassStudent).delete({ studentId });
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

  private normalizeIds(ids?: number[]): number[] {
    if (!ids || ids.length === 0) {
      return [];
    }

    return [...new Set(ids)];
  }

  private parsePackageIdsFromQuery(packageIds: string | string[]): number[] {
    const rawValues = Array.isArray(packageIds)
      ? packageIds
      : packageIds.split(',');

    const normalized = rawValues
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .map((value) => Number(value));

    if (normalized.some((value) => !Number.isInteger(value) || value < 1)) {
      throw new BadRequestException(
        'packageIds must be a list of positive integers',
      );
    }

    return [...new Set(normalized)];
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
      select: ['id', 'totalSessions', 'name'],
    });

    const foundIds = new Set(packages.map((packageEntity) => packageEntity.id));
    const missingIds = packageIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Invalid packageIds: ${missingIds.join(', ')}`,
      );
    }

    return packages;
  }

  private async resolveParents(
    parentInputs: StudentParentDto[],
    manager?: EntityManager,
  ): Promise<Parent[]> {
    if (parentInputs.length === 0) {
      return [];
    }

    const parentRepository =
      manager?.getRepository(Parent) ?? this.parentRepository;

    const existingParentIds = [
      ...new Set(
        parentInputs
          .map((parentInput) => parentInput.id)
          .filter((id): id is number => id !== undefined),
      ),
    ];

    const existingParents =
      existingParentIds.length > 0
        ? await parentRepository.find({ where: { id: In(existingParentIds) } })
        : [];

    if (existingParents.length !== existingParentIds.length) {
      const foundIds = new Set(existingParents.map((parent) => parent.id));
      const missingIds = existingParentIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `Invalid parent ids: ${missingIds.join(', ')}`,
      );
    }

    const existingParentMap = new Map(
      existingParents.map((parent) => [parent.id, parent]),
    );

    const newParentPayloads = parentInputs
      .filter((parentInput) => parentInput.id === undefined)
      .map((parentInput) => ({
        name: parentInput.name as string,
        phone: parentInput.phone,
        email: parentInput.email,
      }));

    const createdParents =
      newParentPayloads.length > 0
        ? await parentRepository.save(
            parentRepository.create(newParentPayloads),
          )
        : [];

    let createdParentIndex = 0;
    const resolvedParents: Parent[] = parentInputs.map((parentInput) => {
      if (parentInput.id !== undefined) {
        const existingParent = existingParentMap.get(parentInput.id);
        if (!existingParent) {
          throw new BadRequestException(`Invalid parent id: ${parentInput.id}`);
        }
        return existingParent;
      }

      const createdParent = createdParents[createdParentIndex];
      createdParentIndex += 1;
      return createdParent;
    });

    return this.uniqueParents(resolvedParents);
  }

  private uniqueParents(parents: Parent[]): Parent[] {
    const seenIds = new Set<number>();
    return parents.filter((parent) => {
      if (seenIds.has(parent.id)) {
        return false;
      }
      seenIds.add(parent.id);
      return true;
    });
  }

  private async syncEnrollments(
    manager: EntityManager,
    studentId: number,
    packages: Package[],
  ): Promise<void> {
    const enrollmentRepository = manager.getRepository(Enrollment);
    await enrollmentRepository.delete({ studentId });

    if (packages.length === 0) {
      return;
    }

    const enrollments = packages.map((packageEntity) =>
      enrollmentRepository.create({
        studentId,
        packageId: packageEntity.id,
        remainingSessions: Number(packageEntity.totalSessions ?? 0),
      }),
    );

    await enrollmentRepository.save(enrollments);
  }

  private async appendEnrollments(
    manager: EntityManager,
    studentId: number,
    packages: Package[],
  ): Promise<void> {
    if (packages.length === 0) {
      return;
    }

    const enrollmentRepository = manager.getRepository(Enrollment);
    const packageIds = packages.map((packageEntity) => packageEntity.id);
    const existingEnrollments = await enrollmentRepository.find({
      where: {
        studentId,
        packageId: In(packageIds),
      },
    });

    const existingEnrollmentMap = new Map(
      existingEnrollments.map((enrollment) => [
        enrollment.packageId,
        enrollment,
      ]),
    );

    const enrollments = packages.map((packageEntity) => {
      const packageSessions = Number(packageEntity.totalSessions ?? 0);
      const existing = existingEnrollmentMap.get(packageEntity.id);

      if (existing) {
        existing.remainingSessions += packageSessions;
        return existing;
      }

      return enrollmentRepository.create({
        studentId,
        packageId: packageEntity.id,
        remainingSessions: packageSessions,
      });
    });

    await enrollmentRepository.save(enrollments);
  }

  private async getStudentSessionStats(
    studentIds: number[],
  ): Promise<
    Map<number, { learnedSessions: number; remainingSessions: number }>
  > {
    const statsMap = new Map<
      number,
      { learnedSessions: number; remainingSessions: number }
    >();

    if (studentIds.length === 0) {
      return statsMap;
    }

    const [learnedRows, remainingRows] = await Promise.all([
      this.attendanceRepository
        .createQueryBuilder('attendance')
        .select('attendance.studentId', 'studentId')
        .addSelect('COUNT(attendance.id)', 'learnedSessions')
        .where('attendance.studentId IN (:...studentIds)', { studentIds })
        // .andWhere('attendance.status != :absentStatus', {
        //   absentStatus: AttendanceStatus.EXCUSED_ABSENT,
        // })
        .groupBy('attendance.studentId')
        .getRawMany<{ studentId: string; learnedSessions: string }>(),
      this.enrollmentRepository
        .createQueryBuilder('enrollment')
        .select('enrollment.studentId', 'studentId')
        .addSelect(
          'COALESCE(SUM(enrollment.remainingSessions), 0)',
          'remainingSessions',
        )
        .where('enrollment.studentId IN (:...studentIds)', { studentIds })
        .groupBy('enrollment.studentId')
        .getRawMany<{ studentId: string; remainingSessions: string }>(),
    ]);

    studentIds.forEach((studentId) => {
      statsMap.set(studentId, {
        learnedSessions: 0,
        remainingSessions: 0,
      });
    });

    learnedRows.forEach((row) => {
      const studentId = Number(row.studentId);
      const current = statsMap.get(studentId) ?? {
        learnedSessions: 0,
        remainingSessions: 0,
      };
      current.learnedSessions = Number(row.learnedSessions ?? 0);
      statsMap.set(studentId, current);
    });

    remainingRows.forEach((row) => {
      const studentId = Number(row.studentId);
      const current = statsMap.get(studentId) ?? {
        learnedSessions: 0,
        remainingSessions: 0,
      };
      current.remainingSessions = Number(row.remainingSessions ?? 0);
      statsMap.set(studentId, current);
    });

    return statsMap;
  }

  private buildStudentProfile(
    student: Student,
    sessionStats?: { learnedSessions: number; remainingSessions: number },
  ) {
    const enrollments = student.enrollments ?? [];
    const packages = enrollments
      .map((enrollment) => enrollment.package)
      .filter((packageEntity): packageEntity is Package =>
        Boolean(packageEntity),
      );

    const remainingByPackage = enrollments
      .filter((enrollment) => Boolean(enrollment.package))
      .map((enrollment) => ({
        packageId: enrollment.packageId,
        packageName: enrollment.package?.name ?? null,
        remainingSessions: Number(enrollment.remainingSessions ?? 0),
      }));

    return {
      ...student,
      packageIds: packages.map((packageEntity) => packageEntity.id),
      packages,
      remainingByPackage,
      learnedSessions: sessionStats?.learnedSessions ?? 0,
      remainingSessions:
        remainingByPackage.reduce(
          (sum, item) => sum + Number(item.remainingSessions ?? 0),
          0,
        ) ||
        sessionStats?.remainingSessions ||
        0,
    };
  }

  private normalizeAttendanceResponse(attendance: any) {
    if (!attendance.session?.classEntity) {
      return attendance;
    }

    const classEntity = attendance.session.classEntity;
    const packages = (classEntity.classPackages ?? [])
      .map((classPackage: any) => classPackage.package)
      .filter((packageEntity: any): packageEntity is Package =>
        Boolean(packageEntity),
      );

    const packageIds = packages.map((pkg: Package) => pkg.id);

    const scheduleByWeekday = this.extractScheduleByWeekdayFromSessions([
      attendance.session,
    ]);

    return {
      ...attendance,
      session: {
        ...attendance.session,
        classEntity: {
          ...classEntity,
          packages,
          packageIds,
          scheduleByWeekday,
          classPackages: undefined,
        },
      },
    };
  }

  private extractScheduleByWeekdayFromSessions(
    sessions: any[],
  ): Record<number, { startTime: string; endTime: string }> {
    const scheduleByWeekday: Record<
      number,
      { startTime: string; endTime: string }
    > = {};

    sessions.forEach((session) => {
      if (!session.sessionDate || !session.startTime || !session.endTime) {
        return;
      }

      const weekday = new Date(session.sessionDate).getDay();
      if (!scheduleByWeekday[weekday]) {
        scheduleByWeekday[weekday] = {
          startTime: session.startTime,
          endTime: session.endTime,
        };
      }
    });

    return scheduleByWeekday;
  }
}
