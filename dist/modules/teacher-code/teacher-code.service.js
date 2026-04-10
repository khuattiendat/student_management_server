"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherCodeService = void 0;
const teacherCode_entity_1 = require("../../database/entities/teacherCode.entity");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../database/entities/user.entity");
let TeacherCodeService = class TeacherCodeService {
    teacherCodeRepository;
    userRepository;
    constructor(teacherCodeRepository, userRepository) {
        this.teacherCodeRepository = teacherCodeRepository;
        this.userRepository = userRepository;
    }
    async create(createTeacherCodeDto) {
        await this.ensureTeacherExists(createTeacherCodeDto.teacherId);
        await this.ensureCodeUnique(createTeacherCodeDto.code);
        const teacherCode = this.teacherCodeRepository.create({
            code: createTeacherCodeDto.code,
            teacherId: createTeacherCodeDto.teacherId,
            expiresAt: this.buildDefaultExpiredAt(),
        });
        return this.teacherCodeRepository.save(teacherCode);
    }
    async findAll(query) {
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
    async findOne(id) {
        const teacherCode = await this.teacherCodeRepository.findOne({
            where: { id },
        });
        if (!teacherCode) {
            throw new common_1.NotFoundException(`Teacher code with id ${id} not found`);
        }
        return teacherCode;
    }
    async update(id, updateTeacherCodeDto) {
        const teacherCode = await this.findOne(id);
        if (updateTeacherCodeDto.code !== undefined &&
            updateTeacherCodeDto.code !== teacherCode.code) {
            await this.ensureCodeUnique(updateTeacherCodeDto.code, id);
            teacherCode.code = updateTeacherCodeDto.code;
        }
        if (updateTeacherCodeDto.teacherId !== undefined &&
            updateTeacherCodeDto.teacherId !== teacherCode.teacherId) {
            await this.ensureTeacherExists(updateTeacherCodeDto.teacherId);
            teacherCode.teacherId = updateTeacherCodeDto.teacherId;
        }
        return this.teacherCodeRepository.save(teacherCode);
    }
    async remove(id) {
        await this.findOne(id);
        await this.teacherCodeRepository.delete(id);
        return {
            message: 'Teacher code deleted successfully',
            id,
        };
    }
    buildDefaultExpiredAt() {
        return new Date(Date.now() + 60 * 60 * 1000);
    }
    async ensureTeacherExists(teacherId) {
        const teacher = await this.userRepository.findOne({
            where: { id: teacherId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException(`Teacher with id ${teacherId} not found`);
        }
        if (teacher.role !== user_entity_1.UserRole.TEACHER) {
            throw new common_1.ConflictException(`User with id ${teacherId} is not a teacher`);
        }
    }
    async ensureCodeUnique(code, excludedId) {
        const queryBuilder = this.teacherCodeRepository
            .createQueryBuilder('teacherCode')
            .where('teacherCode.code = :code', { code });
        if (excludedId) {
            queryBuilder.andWhere('teacherCode.id != :excludedId', { excludedId });
        }
        const existedCode = await queryBuilder.getOne();
        if (existedCode) {
            throw new common_1.ConflictException(`Mã ${code} đã tồn tại`);
        }
    }
};
exports.TeacherCodeService = TeacherCodeService;
exports.TeacherCodeService = TeacherCodeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(teacherCode_entity_1.TeacherCode)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TeacherCodeService);
//# sourceMappingURL=teacher-code.service.js.map