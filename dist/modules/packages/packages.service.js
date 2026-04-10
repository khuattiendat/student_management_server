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
exports.PackagesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const package_entity_1 = require("../../database/entities/package.entity");
const class_packages_entity_1 = require("../../database/entities/class_packages.entity");
const enrollment_entity_1 = require("../../database/entities/enrollment.entity");
let PackagesService = class PackagesService {
    packageRepository;
    constructor(packageRepository) {
        this.packageRepository = packageRepository;
    }
    async create(createPackageDto) {
        const packageEntity = this.packageRepository.create(createPackageDto);
        return this.packageRepository.save(packageEntity);
    }
    async findAll(query) {
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.max(Number(query.limit) || 10, 1);
        const search = query.search?.trim();
        const queryBuilder = this.packageRepository
            .createQueryBuilder('package')
            .orderBy('package.id', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        if (search) {
            queryBuilder.andWhere('(package.name LIKE :search OR package.type LIKE :search)', {
                search: `%${search}%`,
            });
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
    async findOne(id) {
        const packageEntity = await this.packageRepository.findOne({
            where: { id },
        });
        if (!packageEntity) {
            throw new common_1.NotFoundException(`Package with id ${id} not found`);
        }
        return packageEntity;
    }
    async update(id, updatePackageDto) {
        const packageEntity = await this.findOne(id);
        Object.assign(packageEntity, updatePackageDto);
        return this.packageRepository.save(packageEntity);
    }
    async remove(id) {
        return this.packageRepository.manager.transaction(async (manager) => {
            const packageRepo = manager.getRepository(package_entity_1.Package);
            const classPackageRepo = manager.getRepository(class_packages_entity_1.ClassPackage);
            const enrollmentRepo = manager.getRepository(enrollment_entity_1.Enrollment);
            const pkg = await packageRepo.findOne({
                where: { id },
            });
            if (!pkg) {
                throw new Error('Package not found');
            }
            await classPackageRepo.delete({ packageId: id });
            await enrollmentRepo.delete({ packageId: id });
            await packageRepo.delete(id);
            return {
                message: 'Package deleted successfully',
                id,
            };
        });
    }
};
exports.PackagesService = PackagesService;
exports.PackagesService = PackagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(package_entity_1.Package)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PackagesService);
//# sourceMappingURL=packages.service.js.map