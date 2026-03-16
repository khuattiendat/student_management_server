import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Branch } from '@/database/entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { AuthenticatedUser } from '@/common/interfaces/authenticated-user.interface';
import { UserRole } from '@/database/entities/user.entity';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
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
      .leftJoinAndSelect('class.teachers', 'teacher')
      .where('teacher.id = :userId', { userId })
      .getMany();

    return branches;
  }
  async create(createBranchDto: CreateBranchDto) {
    const branch = this.branchRepository.create(createBranchDto);
    return this.branchRepository.save(branch);
  }

  async findAll(query: BaseQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);
    const search = query.search?.trim();

    const where = search
      ? [
          { name: Like(`%${search}%`) },
          { address: Like(`%${search}%`) },
          { phone: Like(`%${search}%`) },
        ]
      : undefined;

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
    const branch = await this.findOne(id);
    if (!branch) {
      throw new NotFoundException(`Branch with id ${id} not found`);
    }
    await this.branchRepository.remove(branch);

    return {
      message: 'Branch deleted successfully',
      id,
    };
  }
}
