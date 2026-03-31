import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { User } from '@/database/entities/user.entity';
import { Branch } from '@/database/entities/branch.entity';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Class } from '@/database/entities/class.entity';
import { TeacherCode } from '@/database/entities/teacherCode.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  async findAll(query: QueryUserDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);
    const search = query.search?.trim();
    const branchId = query.branchId ? Number(query.branchId) : null;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.branches', 'branches')
      .leftJoinAndSelect('user.classes', 'classes')
      .where('user.deletedAt IS NULL')
      .where('user.role != :adminRole', { adminRole: 'admin' })
      .orderBy('user.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        new Brackets((builder) => {
          builder
            .where('user.name LIKE :search', { search: `%${search}%` })
            .orWhere('user.user_name LIKE :search', { search: `%${search}%` })
            .orWhere('user.phone LIKE :search', { search: `%${search}%` });
        }),
      );
    }
    if (branchId) {
      queryBuilder.andWhere('branches.id = :branchId', { branchId });
    }
    if (query.status) {
      queryBuilder.andWhere('user.status = :status', {
        status: query.status,
      });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items: items.map((user) => this.buildUserProfile(user)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const user = await this.findUserById(id);
    return this.buildUserProfile(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findUserById(id);

    if (
      updateUserDto.userName !== undefined &&
      updateUserDto.userName !== user.userName
    ) {
      const existingUser = await this.userRepository.findOne({
        where: { userName: updateUserDto.userName },
      });

      if (existingUser) {
        throw new ConflictException('Username already exists');
      }

      user.userName = updateUserDto.userName;
    }

    if (updateUserDto.name !== undefined) {
      user.name = updateUserDto.name;
    }

    if (updateUserDto.phone !== undefined) {
      user.phone = updateUserDto.phone;
    }

    if (updateUserDto.role !== undefined) {
      user.role = updateUserDto.role;
    }

    if (updateUserDto.status !== undefined) {
      user.status = updateUserDto.status;
    }

    if (updateUserDto.branchIds !== undefined) {
      user.branches = await this.resolveBranches(updateUserDto.branchIds);
    }

    const updatedUser = await this.userRepository.save(user);
    return this.buildUserProfile(updatedUser);
  }

  async remove(id: number) {
    return this.userRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const userRepository = transactionalEntityManager.getRepository(User);
        const classRepository = transactionalEntityManager.getRepository(Class);
        const teacherCodeRepository =
          transactionalEntityManager.getRepository(TeacherCode);
        const user = await userRepository.findOne({
          where: { id },
        });

        if (!user) {
          throw new NotFoundException(`User with id ${id} not found`);
        }
        await classRepository.update({ teacher: { id } }, { teacher: null });
        await teacherCodeRepository.delete({ teacherId: id });
        await transactionalEntityManager.remove(user);
        return {
          message: 'User deleted successfully',
          id,
        };
      },
    );
  }

  private async findUserById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['branches'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  private async resolveBranches(branchIds: number[]) {
    const uniqueBranchIds = [...new Set(branchIds)];

    if (uniqueBranchIds.length === 0) {
      return [];
    }

    const branches = await this.branchRepository.find({
      where: { id: In(uniqueBranchIds) },
    });

    if (branches.length !== uniqueBranchIds.length) {
      const foundIds = new Set(branches.map((branch) => branch.id));
      const missingBranchIds = uniqueBranchIds.filter(
        (id) => !foundIds.has(id),
      );
      throw new BadRequestException(
        `Invalid branchIds: ${missingBranchIds.join(', ')}`,
      );
    }

    return branches;
  }

  private buildUserProfile(user: User) {
    const branches =
      user.branches?.map((branch) => ({
        id: branch.id,
        name: branch.name,
      })) || [];
    const classes =
      user.classes?.map((classEntity) => ({
        id: classEntity.id,
        name: classEntity.name,
      })) || [];

    return {
      id: user.id,
      name: user.name,
      userName: user.userName,
      phone: user.phone,
      branches,
      classes,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
