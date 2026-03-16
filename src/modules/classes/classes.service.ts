import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Class } from '@/database/entities/class.entity';
import { Branch } from '@/database/entities/branch.entity';
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
  ) {}

  async create(createClassDto: CreateClassDto) {
    const classEntity = this.classRepository.create(createClassDto);

    if (createClassDto.branchId !== undefined) {
      classEntity.branch = await this.ensureBranchExists(
        createClassDto.branchId,
      );
    }

    return this.classRepository.save(classEntity);
  }

  async findAll(query: QueryClassDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);
    const search = query.search?.trim();

    const queryBuilder = this.classRepository
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.branch', 'branch')
      .orderBy('class.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        new Brackets((builder) => {
          builder
            .where('class.name LIKE :search', { search: `%${search}%` })
            .orWhere('branch.name LIKE :search', { search: `%${search}%` });
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
    const classEntity = await this.classRepository.findOne({
      where: { id },
      relations: ['branch'],
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with id ${id} not found`);
    }

    return classEntity;
  }

  async update(id: number, updateClassDto: UpdateClassDto) {
    const classEntity = await this.findOne(id);

    if (updateClassDto.branchId !== undefined) {
      classEntity.branch = await this.ensureBranchExists(
        updateClassDto.branchId,
      );
    }

    Object.assign(classEntity, updateClassDto);

    return this.classRepository.save(classEntity);
  }

  async remove(id: number) {
    const classEntity = await this.findOne(id);
    await this.classRepository.remove(classEntity);

    return {
      message: 'Class deleted successfully',
      id,
    };
  }

  private async ensureBranchExists(branchId: number): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
    });

    if (!branch) {
      throw new BadRequestException(`Invalid branchId: ${branchId}`);
    }

    return branch;
  }
}
