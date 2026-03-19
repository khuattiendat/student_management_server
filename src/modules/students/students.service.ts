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
import { Package, PackageType } from '@/database/entities/package.entity';
import { Enrollment } from '@/database/entities/enrollment.entity';
import {
  Attendance,
  AttendanceStatus,
} from '@/database/entities/attendance.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { StudentParentDto } from './dto/student-parent.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentRemainings } from '@/database/entities/student_remainings.entity';
import { RenewStudentCourseDto } from './dto/renew-student-course.dto';
import { QueryStudentAttendanceDto } from './dto/query-student-attendance.dto';

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
    @InjectRepository(StudentRemainings)
    private readonly studentRemainingsRepository: Repository<StudentRemainings>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
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

      await this.ensurePackagesExist(normalizedPackageIds, manager);
      const totalGeneralSessions = await this.calculateGeneralTotalSessions(
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
        birthday: createStudentDto.birthday
          ? new Date(createStudentDto.birthday)
          : undefined,
        phone: createStudentDto.phone,
        branchId: branch ? branch.id : null,
        branch,
        parents,
      });

      const savedStudent = await studentRepository.save(student);
      await this.syncEnrollments(
        manager,
        savedStudent.id,
        normalizedPackageIds,
      );
      await this.syncStudentRemainings(
        savedStudent.id,
        totalGeneralSessions,
        manager,
      );

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
            .orWhere('parent.name LIKE :search', { search: `%${search}%` })
            .orWhere('branch.name LIKE :search', { search: `%${search}%` })
            .orWhere('package.name LIKE :search', { search: `%${search}%` });
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
      .leftJoinAndSelect('classEntity.package', 'package')
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
    } else {
      queryBuilder.andWhere('attendance.status != :absentStatus', {
        absentStatus: AttendanceStatus.ABSENT,
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

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    return this.studentRepository.manager.transaction(async (manager) => {
      const student = await this.findStudentEntityById(id, manager);

      if (updateStudentDto.name !== undefined) {
        student.name = updateStudentDto.name;
      }

      if (updateStudentDto.phone !== undefined) {
        student.phone = updateStudentDto.phone;
      }

      if (updateStudentDto.birthday !== undefined) {
        student.birthday = new Date(updateStudentDto.birthday);
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
      await this.ensurePackagesExist(normalizedPackageIds, manager);

      await this.appendEnrollments(manager, id, normalizedPackageIds);

      const additionalGeneralSessions =
        await this.calculateGeneralTotalSessions(normalizedPackageIds, manager);

      await this.incrementStudentRemainings(
        id,
        additionalGeneralSessions,
        manager,
      );

      const updatedStudent = await this.findStudentEntityById(id, manager);
      return this.buildStudentProfile(updatedStudent);
    });
  }

  async remove(id: number) {
    const student = await this.findStudentEntityById(id);
    await this.studentRepository.remove(student);

    return {
      message: 'Student deleted successfully',
      id,
    };
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

  private async ensurePackagesExist(
    packageIds: number[],
    manager?: EntityManager,
  ): Promise<void> {
    if (packageIds.length === 0) {
      return;
    }

    const packageRepository =
      manager?.getRepository(Package) ?? this.packageRepository;
    const packages = await packageRepository.find({
      where: { id: In(packageIds) },
      select: ['id'],
    });

    const foundIds = new Set(packages.map((packageEntity) => packageEntity.id));
    const missingIds = packageIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Invalid packageIds: ${missingIds.join(', ')}`,
      );
    }
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
    packageIds: number[],
  ): Promise<void> {
    const enrollmentRepository = manager.getRepository(Enrollment);
    await enrollmentRepository.delete({ studentId });

    if (packageIds.length === 0) {
      return;
    }

    const enrollments = packageIds.map((packageId) =>
      enrollmentRepository.create({
        studentId,
        packageId,
      }),
    );

    await enrollmentRepository.save(enrollments);
  }

  private async appendEnrollments(
    manager: EntityManager,
    studentId: number,
    packageIds: number[],
  ): Promise<void> {
    if (packageIds.length === 0) {
      return;
    }

    const enrollmentRepository = manager.getRepository(Enrollment);
    const enrollments = packageIds.map((packageId) =>
      enrollmentRepository.create({
        studentId,
        packageId,
      }),
    );

    await enrollmentRepository.save(enrollments);
  }

  private async calculateGeneralTotalSessions(
    packageIds: number[],
    manager?: EntityManager,
  ): Promise<number> {
    if (packageIds.length === 0) {
      return 0;
    }

    const packageRepository =
      manager?.getRepository(Package) ?? this.packageRepository;

    const rawTotal = await packageRepository
      .createQueryBuilder('package')
      .select('COALESCE(SUM(package.totalSessions), 0)', 'totalSessions')
      .where('package.id IN (:...ids)', { ids: packageIds })
      .andWhere('package.type = :type', { type: PackageType.GENERAL })
      .getRawOne<{ totalSessions: string | number }>();

    return Number(rawTotal?.totalSessions ?? 0);
  }

  private async syncStudentRemainings(
    studentId: number,
    remainingSessions: number,
    manager?: EntityManager,
  ): Promise<void> {
    const studentRemainingsRepository =
      manager?.getRepository(StudentRemainings) ??
      this.studentRemainingsRepository;

    await studentRemainingsRepository.delete({ studentId });

    if (remainingSessions <= 0) {
      return;
    }

    await studentRemainingsRepository.save(
      studentRemainingsRepository.create({
        studentId,
        remainingSessions,
      }),
    );
  }

  private async incrementStudentRemainings(
    studentId: number,
    additionalSessions: number,
    manager?: EntityManager,
  ): Promise<void> {
    if (additionalSessions <= 0) {
      return;
    }

    const studentRemainingsRepository =
      manager?.getRepository(StudentRemainings) ??
      this.studentRemainingsRepository;

    const studentRemainings = await studentRemainingsRepository.findOne({
      where: { studentId },
    });

    if (!studentRemainings) {
      await studentRemainingsRepository.save(
        studentRemainingsRepository.create({
          studentId,
          remainingSessions: additionalSessions,
        }),
      );
      return;
    }

    studentRemainings.remainingSessions += additionalSessions;
    await studentRemainingsRepository.save(studentRemainings);
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
        .andWhere('attendance.status != :absentStatus', {
          absentStatus: AttendanceStatus.ABSENT,
        })
        .groupBy('attendance.studentId')
        .getRawMany<{ studentId: string; learnedSessions: string }>(),
      this.studentRemainingsRepository
        .createQueryBuilder('studentRemaining')
        .select('studentRemaining.studentId', 'studentId')
        .addSelect(
          'COALESCE(SUM(studentRemaining.remainingSessions), 0)',
          'remainingSessions',
        )
        .where('studentRemaining.studentId IN (:...studentIds)', { studentIds })
        .groupBy('studentRemaining.studentId')
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
    const packages = (student.enrollments ?? [])
      .map((enrollment) => enrollment.package)
      .filter((packageEntity): packageEntity is Package =>
        Boolean(packageEntity),
      );

    return {
      ...student,
      packageIds: packages.map((packageEntity) => packageEntity.id),
      packages,
      learnedSessions: sessionStats?.learnedSessions ?? 0,
      remainingSessions: sessionStats?.remainingSessions ?? 0,
    };
  }
}
