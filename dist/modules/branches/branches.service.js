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
exports.BranchesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const branch_entity_1 = require("../../database/entities/branch.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const student_entity_1 = require("../../database/entities/student.entity");
let BranchesService = class BranchesService {
    branchRepository;
    constructor(branchRepository) {
        this.branchRepository = branchRepository;
    }
    async findAllWithClasses(user) {
        const userId = user.sub;
        const userRole = user.role;
        if (userRole === user_entity_1.UserRole.ADMIN) {
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
    async findAllTrash(query) {
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
    async create(createBranchDto) {
        const branch = this.branchRepository.create(createBranchDto);
        return this.branchRepository.save(branch);
    }
    async findAll(query) {
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.max(Number(query.limit) || 10, 1);
        const search = query.search?.trim();
        const where = search
            ? [
                { name: (0, typeorm_2.Like)(`%${search}%`) },
                { address: (0, typeorm_2.Like)(`%${search}%`) },
                { phone: (0, typeorm_2.Like)(`%${search}%`) },
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
    async findOne(id) {
        const branch = await this.branchRepository.findOne({ where: { id } });
        if (!branch) {
            throw new common_1.NotFoundException(`Branch with id ${id} not found`);
        }
        return branch;
    }
    async update(id, updateBranchDto) {
        const branch = await this.findOne(id);
        if (!branch) {
            throw new common_1.NotFoundException(`Branch with id ${id} not found`);
        }
        Object.assign(branch, updateBranchDto);
        return this.branchRepository.save(branch);
    }
    async remove(id) {
        return this.branchRepository.manager.transaction(async (transactionalEntityManager) => {
            const branchRepository = transactionalEntityManager.getRepository(branch_entity_1.Branch);
            const studentRepository = transactionalEntityManager.getRepository(student_entity_1.Student);
            await this.ensureBranchExistsInRepository(id, branchRepository);
            await this.softDeleteRelatedUsersAndStudents(id, branchRepository, studentRepository);
            await branchRepository.softDelete(id);
            return {
                message: 'Branch deleted successfully',
                id,
            };
        });
    }
    async forceRemove(id) {
        return this.branchRepository.manager.transaction(async (transactionalEntityManager) => {
            const branchRepository = transactionalEntityManager.getRepository(branch_entity_1.Branch);
            const studentRepository = transactionalEntityManager.getRepository(student_entity_1.Student);
            await this.hardDeleteRelatedUsersAndStudents(id, branchRepository, studentRepository);
            await branchRepository.delete(id);
            return {
                message: 'Branch permanently deleted successfully',
                id,
            };
        });
    }
    async restore(id) {
        return this.branchRepository.manager.transaction(async (transactionalEntityManager) => {
            const branchRepository = transactionalEntityManager.getRepository(branch_entity_1.Branch);
            const studentRepository = transactionalEntityManager.getRepository(student_entity_1.Student);
            const branch = await branchRepository.findOne({
                where: { id },
                withDeleted: true,
            });
            if (!branch) {
                throw new common_1.NotFoundException(`Branch with id ${id} not found`);
            }
            if (!branch.deletedAt) {
                throw new common_1.BadRequestException(`Branch with id ${id} is not deleted`);
            }
            await branchRepository.restore(id);
            await this.restoreRelatedUsersAndStudents(id, studentRepository);
            return {
                message: 'Branch restored successfully',
                id,
            };
        });
    }
    async ensureBranchExistsInRepository(id, branchRepository) {
        const branch = await branchRepository.findOne({ where: { id } });
        if (!branch) {
            throw new common_1.NotFoundException(`Branch with id ${id} not found`);
        }
    }
    async softDeleteRelatedUsersAndStudents(branchId, branchRepository, studentRepository) {
        await this.detachUsersFromBranch(branchId, branchRepository);
        await studentRepository.update({ branchId, deletedAt: (0, typeorm_2.IsNull)() }, { deletedByBranchId: branchId });
        await Promise.all([
            studentRepository.softDelete({ branchId, deletedAt: (0, typeorm_2.IsNull)() }),
        ]);
    }
    async hardDeleteRelatedUsersAndStudents(branchId, branchRepository, studentRepository) {
        await this.detachUsersFromBranch(branchId, branchRepository);
        await Promise.all([studentRepository.delete({ branchId })]);
    }
    async restoreRelatedUsersAndStudents(branchId, studentRepository) {
        await Promise.all([
            studentRepository.restore({
                branchId,
                deletedByBranchId: branchId,
            }),
        ]);
        await studentRepository.update({ branchId, deletedByBranchId: branchId }, { deletedByBranchId: null });
    }
    async detachUsersFromBranch(branchId, branchRepository) {
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
            .relation(branch_entity_1.Branch, 'managedUsers')
            .of(branchId)
            .remove(userIds);
    }
};
exports.BranchesService = BranchesService;
exports.BranchesService = BranchesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(branch_entity_1.Branch)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BranchesService);
//# sourceMappingURL=branches.service.js.map