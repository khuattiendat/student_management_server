import { TeacherCode } from '@/database/entities/teacherCode.entity';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTeacherCodeDto } from './dto/create-teacher-code.dto';
import { UpdateTeacherCodeDto } from './dto/update-teacher-code.dto';
import { QueryTeacherCodeDto } from './dto/query-teacher-code.dto';
import { User, UserRole } from '@/database/entities/user.entity';

@Injectable()
export class TeacherCodeService {
  constructor(
    @InjectRepository(TeacherCode)
    private readonly teacherCodeRepository: Repository<TeacherCode>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createTeacherCodeDto: CreateTeacherCodeDto) {
    await this.ensureTeacherExists(createTeacherCodeDto.teacherId);
    await this.ensureCodeUnique(createTeacherCodeDto.code);

    const teacherCode = this.teacherCodeRepository.create({
      code: createTeacherCodeDto.code,
      teacherId: createTeacherCodeDto.teacherId,
      expiresAt: this.buildDefaultExpiredAt(),
    });

    return this.teacherCodeRepository.save(teacherCode);
  }

  async findAll(query: QueryTeacherCodeDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);
    const search = query.search?.trim();

    const queryBuilder = this.teacherCodeRepository
      .createQueryBuilder('teacherCode')
      .orderBy('teacherCode.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere('teacherCode.code LIKE :search', {
        search: `%${search}%`,
      });
    }

    if (query.teacherId) {
      queryBuilder.andWhere('teacherCode.teacher_id = :teacherId', {
        teacherId: query.teacherId,
      });
    }
    if (query.status) {
      const isActive = query.status === 'active';
      queryBuilder.andWhere('(teacherCode.is_used = false) = :isActive', {
        isActive,
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

  async findOne(id: number) {
    const teacherCode = await this.teacherCodeRepository.findOne({
      where: { id },
    });

    if (!teacherCode) {
      throw new NotFoundException(`Teacher code with id ${id} not found`);
    }

    return teacherCode;
  }

  async update(id: number, updateTeacherCodeDto: UpdateTeacherCodeDto) {
    const teacherCode = await this.findOne(id);

    if (
      updateTeacherCodeDto.code !== undefined &&
      updateTeacherCodeDto.code !== teacherCode.code
    ) {
      await this.ensureCodeUnique(updateTeacherCodeDto.code, id);
      teacherCode.code = updateTeacherCodeDto.code;
    }

    if (
      updateTeacherCodeDto.teacherId !== undefined &&
      updateTeacherCodeDto.teacherId !== teacherCode.teacherId
    ) {
      await this.ensureTeacherExists(updateTeacherCodeDto.teacherId);
      teacherCode.teacherId = updateTeacherCodeDto.teacherId;
    }

    return this.teacherCodeRepository.save(teacherCode);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.teacherCodeRepository.delete(id);

    return {
      message: 'Teacher code deleted successfully',
      id,
    };
  }

  private buildDefaultExpiredAt() {
    return new Date(Date.now() + 60 * 60 * 1000); // 1 tiếng
  }

  private async ensureTeacherExists(teacherId: number) {
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with id ${teacherId} not found`);
    }

    if (teacher.role !== UserRole.TEACHER) {
      throw new ConflictException(`User with id ${teacherId} is not a teacher`);
    }
  }

  private async ensureCodeUnique(code: string, excludedId?: number) {
    const queryBuilder = this.teacherCodeRepository
      .createQueryBuilder('teacherCode')
      .where('teacherCode.code = :code', { code });

    if (excludedId) {
      queryBuilder.andWhere('teacherCode.id != :excludedId', { excludedId });
    }

    const existedCode = await queryBuilder.getOne();

    if (existedCode) {
      throw new ConflictException(`Mã ${code} đã tồn tại`);
    }
  }
}
