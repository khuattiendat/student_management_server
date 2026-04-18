import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Like, Repository } from 'typeorm';
import { Branch } from '@/database/entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { AuthenticatedUser } from '@/common/interfaces/authenticated-user.interface';
import { UserRole } from '@/database/entities/user.entity';
import { Student } from '@/database/entities/student.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,

    private readonly userService: UsersService,
  ) {}

  async findAllWithClasses(user: AuthenticatedUser) {
    const userId = user.sub;
    const userRole = user.role;
    if (userRole === UserRole.ADMIN) {
      const branches = await this.branchRepository
        .createQueryBuilder('branch')
        .leftJoinAndSelect('branch.classes', 'class')
        .where('class.status = :status', { status: 'active' })
        .getMany();

      return branches;
    }
    const branches = await this.branchRepository
      .createQueryBuilder('branch')
      .leftJoinAndSelect('branch.classes', 'class')
      .leftJoinAndSelect('class.teacher', 'teacher')
      .where('teacher.id = :userId', { userId })
      .getMany();

    return branches;
  }
  async findAllTrash(query: BaseQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);
    const queryBuilder = this.branchRepository
      .createQueryBuilder('branch')
      .withDeleted()
      .where('branch.deletedAt IS NOT NULL');

    const [items, total] = await queryBuilder
      .orderBy('branch.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

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
  async create(createBranchDto: CreateBranchDto) {
    const branch = this.branchRepository.create(createBranchDto);
    return this.branchRepository.save(branch);
  }

  async findAll(user: AuthenticatedUser, query: BaseQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);
    const search = query.search?.trim();
    const { role, sub: userId } = user;
    let where = {} as any;

    const isAdmin = role === UserRole.ADMIN;
    if (!isAdmin) {
      const branchIds = await this.userService.getBranchIdsForUser(userId);

      where = search
        ? [
            { id: In(branchIds), name: Like(`%${search}%`) },
            { id: In(branchIds), address: Like(`%${search}%`) },
            { id: In(branchIds), phone: Like(`%${search}%`) },
          ]
        : { id: In(branchIds) };
    }

    if (isAdmin) {
      where = search
        ? [
            { name: Like(`%${search}%`) },
            { address: Like(`%${search}%`) },
            { phone: Like(`%${search}%`) },
          ]
        : undefined;
    }

    const [items, total] = await this.branchRepository.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

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
    const branch = await this.branchRepository.findOne({ where: { id } });

    if (!branch) {
      throw new NotFoundException(`Branch with id ${id} not found`);
    }

    return branch;
  }

  async update(id: number, updateBranchDto: UpdateBranchDto) {
    const branch = await this.findOne(id);
    if (!branch) {
      throw new NotFoundException(`Branch with id ${id} not found`);
    }
    Object.assign(branch, updateBranchDto);
    return this.branchRepository.save(branch);
  }

  async remove(id: number) {
    return this.branchRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const branchRepository =
          transactionalEntityManager.getRepository(Branch);
        const studentRepository =
          transactionalEntityManager.getRepository(Student);

        await this.ensureBranchExistsInRepository(id, branchRepository);
        await this.softDeleteRelatedUsersAndStudents(
          id,
          branchRepository,
          studentRepository,
        );
        await branchRepository.softDelete(id);

        return {
          message: 'Branch deleted successfully',
          id,
        };
      },
    );
  }

  async forceRemove(id: number) {
    return this.branchRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const branchRepository =
          transactionalEntityManager.getRepository(Branch);
        const studentRepository =
          transactionalEntityManager.getRepository(Student);

        await this.hardDeleteRelatedUsersAndStudents(
          id,
          branchRepository,
          studentRepository,
        );
        await branchRepository.delete(id);

        return {
          message: 'Branch permanently deleted successfully',
          id,
        };
      },
    );
  }

  async restore(id: number) {
    return this.branchRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const branchRepository =
          transactionalEntityManager.getRepository(Branch);
        const studentRepository =
          transactionalEntityManager.getRepository(Student);

        const branch = await branchRepository.findOne({
          where: { id },
          withDeleted: true,
        });

        if (!branch) {
          throw new NotFoundException(`Branch with id ${id} not found`);
        }

        if (!branch.deletedAt) {
          throw new BadRequestException(`Branch with id ${id} is not deleted`);
        }

        await branchRepository.restore(id);
        await this.restoreRelatedUsersAndStudents(id, studentRepository);

        return {
          message: 'Branch restored successfully',
          id,
        };
      },
    );
  }

  private async ensureBranchExistsInRepository(
    id: number,
    branchRepository: Repository<Branch>,
  ): Promise<void> {
    const branch = await branchRepository.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException(`Branch with id ${id} not found`);
    }
  }

  private async softDeleteRelatedUsersAndStudents(
    branchId: number,
    branchRepository: Repository<Branch>,
    studentRepository: Repository<Student>,
  ): Promise<void> {
    await this.detachUsersFromBranch(branchId, branchRepository);

    await studentRepository.update(
      { branchId, deletedAt: IsNull() },
      { deletedByBranchId: branchId },
    );

    await Promise.all([
      studentRepository.softDelete({ branchId, deletedAt: IsNull() }),
    ]);
  }

  private async hardDeleteRelatedUsersAndStudents(
    branchId: number,
    branchRepository: Repository<Branch>,
    studentRepository: Repository<Student>,
  ): Promise<void> {
    await this.detachUsersFromBranch(branchId, branchRepository);

    await Promise.all([studentRepository.delete({ branchId })]);
  }

  private async restoreRelatedUsersAndStudents(
    branchId: number,
    studentRepository: Repository<Student>,
  ): Promise<void> {
    await Promise.all([
      studentRepository.restore({
        branchId,
        deletedByBranchId: branchId,
      }),
    ]);
    await studentRepository.update(
      { branchId, deletedByBranchId: branchId },
      { deletedByBranchId: null },
    );
  }

  private async detachUsersFromBranch(
    branchId: number,
    branchRepository: Repository<Branch>,
  ): Promise<void> {
    const branchWithUsers = await branchRepository.findOne({
      where: { id: branchId },
      relations: ['managedUsers'],
    });

    if (!branchWithUsers || !branchWithUsers.managedUsers.length) {
      return;
    }

    const userIds = branchWithUsers.managedUsers.map((user) => user.id);

    await branchRepository
      .createQueryBuilder()
      .relation(Branch, 'managedUsers')
      .of(branchId)
      .remove(userIds);
  }
}
