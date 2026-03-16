import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package } from '@/database/entities/package.entity';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { QueryPackageDto } from './dto/query-package.dto';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private readonly packageRepository: Repository<Package>,
  ) {}

  async create(createPackageDto: CreatePackageDto) {
    const packageEntity = this.packageRepository.create(createPackageDto);
    return this.packageRepository.save(packageEntity);
  }

  async findAll(query: QueryPackageDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);
    const search = query.search?.trim();

    const queryBuilder = this.packageRepository
      .createQueryBuilder('package')
      .orderBy('package.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        '(package.name LIKE :search OR package.type LIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    if (query.type) {
      queryBuilder.andWhere('package.type = :type', { type: query.type });
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
    const packageEntity = await this.packageRepository.findOne({
      where: { id },
    });

    if (!packageEntity) {
      throw new NotFoundException(`Package with id ${id} not found`);
    }

    return packageEntity;
  }

  async update(id: number, updatePackageDto: UpdatePackageDto) {
    const packageEntity = await this.findOne(id);
    Object.assign(packageEntity, updatePackageDto);
    return this.packageRepository.save(packageEntity);
  }

  async remove(id: number) {
    const packageEntity = await this.findOne(id);
    await this.packageRepository.remove(packageEntity);

    return {
      message: 'Package deleted successfully',
      id,
    };
  }
}
