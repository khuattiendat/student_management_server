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
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const branch_entity_1 = require("./database/entities/branch.entity");
const student_entity_1 = require("./database/entities/student.entity");
const user_entity_1 = require("./database/entities/user.entity");
const class_entity_1 = require("./database/entities/class.entity");
const class_student_entity_1 = require("./database/entities/class_student.entity");
let AppService = class AppService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    getHello() {
        return 'Hello World 123';
    }
    async getAdminDashboard(params) {
        const branchId = this.parseOptionalPositiveInt(params.branchId);
        const selectedBranch = branchId
            ? await this.getSelectedBranchOrThrow(branchId)
            : null;
        const [studentsTotal, teachersTotal, classesTotal, newStudentsLast6Months] = await Promise.all([
            this.getStudentsTotal(branchId),
            this.getTeachersTotal(branchId),
            this.getClassesTotal(branchId),
            this.getNewStudentsLast6Months(branchId),
        ]);
        const [topClassesBySize, byBranch, newStudentsByMonth] = await Promise.all([
            this.getTopClassesBySize(branchId, 5),
            this.getStatsByBranch(),
            this.getNewStudentsByMonth(branchId, 6),
        ]);
        return {
            branchFilter: {
                branchId: branchId ?? null,
                branchName: selectedBranch?.name ?? null,
            },
            overview: {
                studentsTotal,
                teachersTotal,
                classesTotal,
                newStudentsLast6Months,
            },
            topClassesBySize,
            newStudentsByMonth,
            byBranch,
        };
    }
    parseOptionalPositiveInt(value) {
        if (value === undefined || value === null || value === '')
            return null;
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed < 1) {
            throw new common_1.BadRequestException('branchId must be a positive integer');
        }
        return parsed;
    }
    async getSelectedBranchOrThrow(branchId) {
        const branch = await this.dataSource.getRepository(branch_entity_1.Branch).findOne({
            where: { id: branchId },
        });
        if (!branch || branch.deletedAt) {
            throw new common_1.NotFoundException(`Branch with id ${branchId} not found`);
        }
        return branch;
    }
    async getStudentsTotal(branchId) {
        const qb = this.dataSource
            .getRepository(student_entity_1.Student)
            .createQueryBuilder('student')
            .where('student.deletedAt IS NULL');
        if (branchId) {
            qb.andWhere('student.branchId = :branchId', { branchId });
        }
        return qb.getCount();
    }
    async getClassesTotal(branchId) {
        const qb = this.dataSource
            .getRepository(class_entity_1.Class)
            .createQueryBuilder('classEntity')
            .innerJoin('classEntity.branch', 'branch')
            .where('classEntity.deletedAt IS NULL')
            .andWhere('branch.deletedAt IS NULL');
        if (branchId) {
            qb.andWhere('branch.id = :branchId', { branchId });
        }
        return qb.getCount();
    }
    async getTeachersTotal(branchId) {
        const qb = this.dataSource
            .getRepository(class_entity_1.Class)
            .createQueryBuilder('classEntity')
            .innerJoin('classEntity.branch', 'branch')
            .leftJoin('classEntity.teacher', 'teacher')
            .where('classEntity.deletedAt IS NULL')
            .andWhere('branch.deletedAt IS NULL')
            .andWhere('classEntity.teacherId IS NOT NULL')
            .andWhere('teacher.deletedAt IS NULL')
            .andWhere('teacher.role = :teacherRole', {
            teacherRole: user_entity_1.UserRole.TEACHER,
        });
        if (branchId) {
            qb.andWhere('branch.id = :branchId', { branchId });
        }
        const row = await qb
            .select('COUNT(DISTINCT classEntity.teacherId)', 'total')
            .getRawOne();
        return Number(row?.total ?? 0);
    }
    async getNewStudentsLast6Months(branchId) {
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - 6);
        const qb = this.dataSource
            .getRepository(student_entity_1.Student)
            .createQueryBuilder('student')
            .where('student.deletedAt IS NULL')
            .andWhere('student.createdAt >= :fromDate', { fromDate });
        if (branchId) {
            qb.andWhere('student.branchId = :branchId', { branchId });
        }
        return qb.getCount();
    }
    async getNewStudentsByMonth(branchId, months = 6) {
        const now = new Date();
        const results = [];
        for (let i = months - 1; i >= 0; i -= 1) {
            const year = now.getFullYear();
            const month = now.getMonth() - i;
            const periodStart = new Date(year, month, 1, 0, 0, 0, 0);
            const periodEnd = new Date(year, month + 1, 1, 0, 0, 0, 0);
            const qb = this.dataSource
                .getRepository(student_entity_1.Student)
                .createQueryBuilder('student')
                .where('student.deletedAt IS NULL')
                .andWhere('student.createdAt >= :periodStart', { periodStart })
                .andWhere('student.createdAt < :periodEnd', { periodEnd });
            if (branchId) {
                qb.andWhere('student.branchId = :branchId', { branchId });
            }
            const count = await qb.getCount();
            const monthLabel = `${periodStart.getMonth() + 1}/${periodStart.getFullYear()}`;
            results.push({
                month: `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`,
                monthLabel,
                count,
            });
        }
        return results;
    }
    async getTopClassesBySize(branchId, limit) {
        const qb = this.dataSource
            .getRepository(class_entity_1.Class)
            .createQueryBuilder('classEntity')
            .innerJoin('classEntity.branch', 'branch')
            .leftJoin(class_student_entity_1.ClassStudent, 'classStudent', 'classStudent.classId = classEntity.id')
            .where('classEntity.deletedAt IS NULL')
            .andWhere('branch.deletedAt IS NULL');
        if (branchId) {
            qb.andWhere('branch.id = :branchId', { branchId });
        }
        const rows = await qb
            .select('classEntity.id', 'classId')
            .addSelect('classEntity.name', 'className')
            .addSelect('branch.id', 'branchId')
            .addSelect('branch.name', 'branchName')
            .addSelect('COUNT(classStudent.id)', 'size')
            .groupBy('classEntity.id')
            .addGroupBy('classEntity.name')
            .addGroupBy('branch.id')
            .addGroupBy('branch.name')
            .orderBy('size', 'DESC')
            .addOrderBy('classEntity.id', 'DESC')
            .limit(limit)
            .getRawMany();
        return rows.map((row) => ({
            classId: Number(row.classId),
            className: row.className,
            branchId: Number(row.branchId),
            branchName: row.branchName,
            size: Number(row.size ?? 0),
        }));
    }
    async getStatsByBranch() {
        const branches = await this.dataSource
            .getRepository(branch_entity_1.Branch)
            .createQueryBuilder('branch')
            .where('branch.deletedAt IS NULL')
            .orderBy('branch.id', 'ASC')
            .getMany();
        const rows = await Promise.all(branches.map(async (branch) => {
            const [studentsTotal, teachersTotal, classesTotal, newStudentsLast6Months,] = await Promise.all([
                this.getStudentsTotal(branch.id),
                this.getTeachersTotal(branch.id),
                this.getClassesTotal(branch.id),
                this.getNewStudentsLast6Months(branch.id),
            ]);
            return {
                branchId: branch.id,
                branchName: branch.name,
                studentsTotal,
                teachersTotal,
                classesTotal,
                newStudentsLast6Months,
            };
        }));
        return rows;
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], AppService);
//# sourceMappingURL=app.service.js.map