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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../database/entities/user.entity");
const branch_entity_1 = require("../../database/entities/branch.entity");
const class_entity_1 = require("../../database/entities/class.entity");
const teacherCode_entity_1 = require("../../database/entities/teacherCode.entity");
let UsersService = class UsersService {
    userRepository;
    branchRepository;
    constructor(userRepository, branchRepository) {
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
    }
    async findAll(query) {
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
            queryBuilder.andWhere(new typeorm_2.Brackets((builder) => {
                builder
                    .where('user.name LIKE :search', { search: `%${search}%` })
                    .orWhere('user.user_name LIKE :search', { search: `%${search}%` })
                    .orWhere('user.phone LIKE :search', { search: `%${search}%` });
            }));
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
    async findOne(id) {
        const user = await this.findUserById(id);
        return this.buildUserProfile(user);
    }
    async update(id, updateUserDto) {
        const user = await this.findUserById(id);
        if (updateUserDto.userName !== undefined &&
            updateUserDto.userName !== user.userName) {
            const existingUser = await this.userRepository.findOne({
                where: { userName: updateUserDto.userName },
            });
            if (existingUser) {
                throw new common_1.ConflictException('Username already exists');
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
    async remove(id) {
        return this.userRepository.manager.transaction(async (transactionalEntityManager) => {
            const userRepository = transactionalEntityManager.getRepository(user_entity_1.User);
            const classRepository = transactionalEntityManager.getRepository(class_entity_1.Class);
            const teacherCodeRepository = transactionalEntityManager.getRepository(teacherCode_entity_1.TeacherCode);
            const user = await userRepository.findOne({
                where: { id },
            });
            if (!user) {
                throw new common_1.NotFoundException(`User with id ${id} not found`);
            }
            await classRepository.update({ teacher: { id } }, { teacher: null });
            await teacherCodeRepository.delete({ teacherId: id });
            await transactionalEntityManager.remove(user);
            return {
                message: 'User deleted successfully',
                id,
            };
        });
    }
    async findUserById(id) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['branches'],
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with id ${id} not found`);
        }
        return user;
    }
    async resolveBranches(branchIds) {
        const uniqueBranchIds = [...new Set(branchIds)];
        if (uniqueBranchIds.length === 0) {
            return [];
        }
        const branches = await this.branchRepository.find({
            where: { id: (0, typeorm_2.In)(uniqueBranchIds) },
        });
        if (branches.length !== uniqueBranchIds.length) {
            const foundIds = new Set(branches.map((branch) => branch.id));
            const missingBranchIds = uniqueBranchIds.filter((id) => !foundIds.has(id));
            throw new common_1.BadRequestException(`Invalid branchIds: ${missingBranchIds.join(', ')}`);
        }
        return branches;
    }
    buildUserProfile(user) {
        const branches = user.branches?.map((branch) => ({
            id: branch.id,
            name: branch.name,
        })) || [];
        const classes = user.classes?.map((classEntity) => ({
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
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(branch_entity_1.Branch)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map