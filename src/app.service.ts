import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Branch } from './database/entities/branch.entity';
import { Student } from './database/entities/student.entity';
import { UserRole } from './database/entities/user.entity';
import { Class } from './database/entities/class.entity';
import { ClassStudent } from './database/entities/class_student.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getAdminDashboard(params: { branchId?: string }) {
    const branchId = this.parseOptionalPositiveInt(params.branchId);
    const selectedBranch = branchId
      ? await this.getSelectedBranchOrThrow(branchId)
      : null;

    const [studentsTotal, teachersTotal, classesTotal, newStudentsLast6Months] =
      await Promise.all([
        this.getStudentsTotal(branchId),
        this.getTeachersTotal(branchId),
        this.getClassesTotal(branchId),
        this.getNewStudentsLast6Months(branchId),
      ]);

    const [topClassesBySize, byBranch, newStudentsByMonth] = await Promise.all([
      this.getTopClassesBySize(branchId, 5),
      this.getStatsByBranch(),
      this.getNewStudentsByMonth(branchId, 6),
    ]);

    return {
      branchFilter: {
        branchId: branchId ?? null,
        branchName: selectedBranch?.name ?? null,
      },
      overview: {
        studentsTotal,
        teachersTotal,
        classesTotal,
        newStudentsLast6Months,
      },
      topClassesBySize,
      newStudentsByMonth,
      byBranch,
    };
  }

  private parseOptionalPositiveInt(value?: string): number | null {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException('branchId must be a positive integer');
    }
    return parsed;
  }

  private async getSelectedBranchOrThrow(branchId: number): Promise<Branch> {
    const branch = await this.dataSource.getRepository(Branch).findOne({
      where: { id: branchId },
    });
    if (!branch || branch.deletedAt) {
      throw new NotFoundException(`Branch with id ${branchId} not found`);
    }
    return branch;
  }

  private async getStudentsTotal(branchId: number | null): Promise<number> {
    const qb = this.dataSource
      .getRepository(Student)
      .createQueryBuilder('student')
      .where('student.deletedAt IS NULL');

    if (branchId) {
      qb.andWhere('student.branchId = :branchId', { branchId });
    }

    return qb.getCount();
  }

  private async getClassesTotal(branchId: number | null): Promise<number> {
    const qb = this.dataSource
      .getRepository(Class)
      .createQueryBuilder('classEntity')
      .innerJoin('classEntity.branch', 'branch')
      .where('classEntity.deletedAt IS NULL')
      .andWhere('branch.deletedAt IS NULL');

    if (branchId) {
      qb.andWhere('branch.id = :branchId', { branchId });
    }

    return qb.getCount();
  }

  private async getTeachersTotal(branchId: number | null): Promise<number> {
    const qb = this.dataSource
      .getRepository(Class)
      .createQueryBuilder('classEntity')
      .innerJoin('classEntity.branch', 'branch')
      .leftJoin('classEntity.teacher', 'teacher')
      .where('classEntity.deletedAt IS NULL')
      .andWhere('branch.deletedAt IS NULL')
      .andWhere('classEntity.teacherId IS NOT NULL')
      .andWhere('teacher.deletedAt IS NULL')
      .andWhere('teacher.role = :teacherRole', {
        teacherRole: UserRole.TEACHER,
      });

    if (branchId) {
      qb.andWhere('branch.id = :branchId', { branchId });
    }

    const row = await qb
      .select('COUNT(DISTINCT classEntity.teacherId)', 'total')
      .getRawOne<{ total: string }>();

    return Number(row?.total ?? 0);
  }

  private async getNewStudentsLast6Months(
    branchId: number | null,
  ): Promise<number> {
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - 6);

    const qb = this.dataSource
      .getRepository(Student)
      .createQueryBuilder('student')
      .where('student.deletedAt IS NULL')
      .andWhere('student.createdAt >= :fromDate', { fromDate });

    if (branchId) {
      qb.andWhere('student.branchId = :branchId', { branchId });
    }

    return qb.getCount();
  }

  private async getNewStudentsByMonth(branchId: number | null, months = 6) {
    const now = new Date();
    const results: Array<{ month: string; monthLabel: string; count: number }> =
      [];

    for (let i = months - 1; i >= 0; i -= 1) {
      const year = now.getFullYear();
      const month = now.getMonth() - i;
      const periodStart = new Date(year, month, 1, 0, 0, 0, 0);
      const periodEnd = new Date(year, month + 1, 1, 0, 0, 0, 0);

      const qb = this.dataSource
        .getRepository(Student)
        .createQueryBuilder('student')
        .where('student.deletedAt IS NULL')
        .andWhere('student.createdAt >= :periodStart', { periodStart })
        .andWhere('student.createdAt < :periodEnd', { periodEnd });

      if (branchId) {
        qb.andWhere('student.branchId = :branchId', { branchId });
      }

      const count = await qb.getCount();
      const monthLabel = `${periodStart.getMonth() + 1}/${periodStart.getFullYear()}`;
      results.push({
        month: `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`,
        monthLabel,
        count,
      });
    }

    return results;
  }

  private async getTopClassesBySize(branchId: number | null, limit: number) {
    const qb = this.dataSource
      .getRepository(Class)
      .createQueryBuilder('classEntity')
      .innerJoin('classEntity.branch', 'branch')
      .leftJoin(
        ClassStudent,
        'classStudent',
        'classStudent.classId = classEntity.id',
      )
      .where('classEntity.deletedAt IS NULL')
      .andWhere('branch.deletedAt IS NULL');

    if (branchId) {
      qb.andWhere('branch.id = :branchId', { branchId });
    }

    const rows = await qb
      .select('classEntity.id', 'classId')
      .addSelect('classEntity.name', 'className')
      .addSelect('branch.id', 'branchId')
      .addSelect('branch.name', 'branchName')
      .addSelect('COUNT(classStudent.id)', 'size')
      .groupBy('classEntity.id')
      .addGroupBy('classEntity.name')
      .addGroupBy('branch.id')
      .addGroupBy('branch.name')
      .orderBy('size', 'DESC')
      .addOrderBy('classEntity.id', 'DESC')
      .limit(limit)
      .getRawMany<{
        classId: string;
        className: string;
        branchId: string;
        branchName: string;
        size: string;
      }>();

    return rows.map((row) => ({
      classId: Number(row.classId),
      className: row.className,
      branchId: Number(row.branchId),
      branchName: row.branchName,
      size: Number(row.size ?? 0),
    }));
  }

  private async getStatsByBranch() {
    const branches = await this.dataSource
      .getRepository(Branch)
      .createQueryBuilder('branch')
      .where('branch.deletedAt IS NULL')
      .orderBy('branch.id', 'ASC')
      .getMany();

    const rows = await Promise.all(
      branches.map(async (branch) => {
        const [
          studentsTotal,
          teachersTotal,
          classesTotal,
          newStudentsLast6Months,
        ] = await Promise.all([
          this.getStudentsTotal(branch.id),
          this.getTeachersTotal(branch.id),
          this.getClassesTotal(branch.id),
          this.getNewStudentsLast6Months(branch.id),
        ]);

        return {
          branchId: branch.id,
          branchName: branch.name,
          studentsTotal,
          teachersTotal,
          classesTotal,
          newStudentsLast6Months,
        };
      }),
    );

    return rows;
  }
}
