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
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_entity_1 = require("../../database/entities/student.entity");
const branch_entity_1 = require("../../database/entities/branch.entity");
const parent_entity_1 = require("../../database/entities/parent.entity");
const package_entity_1 = require("../../database/entities/package.entity");
const enrollment_entity_1 = require("../../database/entities/enrollment.entity");
const attendance_entity_1 = require("../../database/entities/attendance.entity");
const class_student_entity_1 = require("../../database/entities/class_student.entity");
const session_entity_1 = require("../../database/entities/session.entity");
const class_entity_1 = require("../../database/entities/class.entity");
const class_packages_entity_1 = require("../../database/entities/class_packages.entity");
const users_service_1 = require("../users/users.service");
const user_entity_1 = require("../../database/entities/user.entity");
let StudentsService = class StudentsService {
    studentRepository;
    branchRepository;
    parentRepository;
    packageRepository;
    enrollmentRepository;
    attendanceRepository;
    sessionRepository;
    classRepository;
    classStudentRepository;
    userService;
    constructor(studentRepository, branchRepository, parentRepository, packageRepository, enrollmentRepository, attendanceRepository, sessionRepository, classRepository, classStudentRepository, userService) {
        this.studentRepository = studentRepository;
        this.branchRepository = branchRepository;
        this.parentRepository = parentRepository;
        this.packageRepository = packageRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.attendanceRepository = attendanceRepository;
        this.sessionRepository = sessionRepository;
        this.classRepository = classRepository;
        this.classStudentRepository = classStudentRepository;
        this.userService = userService;
    }
    async create(createStudentDto) {
        const { name, addressDetail, birthday, branchId, isPaid, packageIds, parents: _parents, phone, provinceCode, provinceName, wardCode, wardName, } = createStudentDto;
        const normalizedPackageIds = this.normalizeIds(packageIds);
        if (normalizedPackageIds.length === 0) {
            throw new common_1.BadRequestException('packageIds must contain at least one package id');
        }
        return this.studentRepository.manager.transaction(async (manager) => {
            const branch = branchId !== undefined
                ? await this.ensureBranchExists(branchId, manager)
                : null;
            const packages = await this.ensurePackagesExist(normalizedPackageIds, manager);
            const parents = await this.resolveParents(_parents ?? [], manager);
            const studentRepository = manager.getRepository(student_entity_1.Student);
            const student = studentRepository.create({
                name: name,
                addressDetail: addressDetail,
                provinceCode: provinceCode,
                wardCode: wardCode,
                provinceName: provinceName,
                wardName: wardName,
                birthday: birthday,
                phone: phone,
                branchId: branch ? branch.id : null,
                branch,
                parents,
            });
            const savedStudent = await studentRepository.save(student);
            await this.syncEnrollments(manager, savedStudent.id, packages, isPaid);
            const createdStudent = await this.findStudentEntityById(savedStudent.id, manager);
            return this.buildStudentProfile(createdStudent);
        });
    }
    async findAll(user, query) {
        const { role, sub: userId } = user;
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.max(Number(query.limit) || 10, 1);
        const search = query.search?.trim();
        const isAdmin = role === user_entity_1.UserRole.ADMIN;
        const queryBuilder = this.studentRepository
            .createQueryBuilder('student')
            .leftJoinAndSelect('student.branch', 'branch')
            .leftJoinAndSelect('student.parents', 'parent')
            .leftJoinAndSelect('student.enrollments', 'enrollment')
            .leftJoinAndSelect('enrollment.package', 'package')
            .leftJoinAndSelect('student.classStudents', 'classStudents')
            .leftJoinAndSelect('classStudents.classEntity', 'classEntity')
            .distinct(true)
            .orderBy('parent.name', 'DESC')
            .addOrderBy('student.id', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        if (search) {
            queryBuilder.andWhere(new typeorm_2.Brackets((builder) => {
                builder
                    .where('student.name LIKE :search', { search: `%${search}%` })
                    .orWhere('student.phone LIKE :search', { search: `%${search}%` })
                    .orWhere('student.birthday LIKE :search', { search: `%${search}%` })
                    .orWhere('parent.name LIKE :search', { search: `%${search}%` });
            }));
        }
        if (!isAdmin) {
            const branchIds = await this.userService.getBranchIdsForUser(userId);
            if (branchIds.length > 0) {
                queryBuilder.andWhere('student.branchId IN (:...branchIds)', {
                    branchIds,
                });
            }
        }
        if (query.branchId) {
            const branchId = Number(query.branchId);
            if (!Number.isInteger(branchId) || branchId < 1) {
                throw new common_1.BadRequestException('branchId must be a positive integer');
            }
            queryBuilder.andWhere('student.branchId = :branchId', { branchId });
        }
        if (query.packageId) {
            const packageId = Number(query.packageId);
            if (!Number.isInteger(packageId) || packageId < 1) {
                throw new common_1.BadRequestException('packageId must be a positive integer');
            }
            queryBuilder.andWhere('enrollment.packageId = :packageId', { packageId });
        }
        if (query.classId) {
            const classId = Number(query.classId);
            if (!Number.isInteger(classId) || classId < 1) {
                throw new common_1.BadRequestException('classId must be a positive integer');
            }
            queryBuilder.andWhere('classStudents.classId = :classId', { classId });
        }
        if (query.isCalled) {
            const isCalled = Number(query.isCalled) === 1;
            queryBuilder.andWhere('student.isCalled = :isCalled', { isCalled });
        }
        if (query.isTexted) {
            const isTexted = Number(query.isTexted) === 1;
            queryBuilder.andWhere('student.isTexted = :isTexted', { isTexted });
        }
        if (query.packageType) {
            queryBuilder.andWhere('package.type = :packageType', {
                packageType: query.packageType,
            });
        }
        if (query.birthMonth) {
            queryBuilder.andWhere('MONTH(student.birthday) = :birthMonth', {
                birthMonth: query.birthMonth,
            });
        }
        const [items, total] = await queryBuilder.getManyAndCount();
        const sessionStats = await this.getStudentSessionStats(items.map((student) => student.id));
        return {
            items: items.map((student) => this.buildStudentProfile(student, sessionStats.get(student.id))),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const student = await this.findStudentEntityById(id);
        const sessionStats = await this.getStudentSessionStats([student.id]);
        return this.buildStudentProfile(student, sessionStats.get(student.id));
    }
    async findAllTrash(query) {
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.max(Number(query.limit) || 10, 1);
        const queryBuilder = this.studentRepository
            .createQueryBuilder('student')
            .withDeleted()
            .where('student.deletedAt IS NOT NULL AND student.deletedBy_branch_id IS NULL')
            .leftJoin('student.branch', 'branch')
            .select([
            'student.id',
            'student.name',
            'student.phone',
            'student.deletedAt',
            'branch.name',
        ])
            .orderBy('student.deletedAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
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
    async findByEnrollments(query) {
        const branchId = Number(query.branchId);
        if (!Number.isInteger(branchId) || branchId < 1) {
            throw new common_1.BadRequestException('branchId must be a positive integer');
        }
        const packageIds = this.parsePackageIdsFromQuery(query.packageIds);
        if (packageIds.length === 0) {
            throw new common_1.BadRequestException('packageIds must contain at least one package id');
        }
        await Promise.all([
            this.ensureBranchExists(branchId),
            this.ensurePackagesExist(packageIds),
        ]);
        const search = query.search?.trim();
        const queryBuilder = this.studentRepository
            .createQueryBuilder('student')
            .leftJoinAndSelect('student.branch', 'branch')
            .leftJoinAndSelect('student.parents', 'parent')
            .leftJoinAndSelect('student.enrollments', 'enrollment')
            .leftJoinAndSelect('enrollment.package', 'package')
            .where('student.branchId = :branchId', { branchId })
            .andWhere('enrollment.packageId IN (:...packageIds)', { packageIds })
            .distinct(true)
            .orderBy('student.id', 'DESC');
        if (search) {
            queryBuilder.andWhere(new typeorm_2.Brackets((builder) => {
                builder
                    .where('student.name LIKE :search', { search: `%${search}%` })
                    .orWhere('student.phone LIKE :search', { search: `%${search}%` })
                    .orWhere('package.name LIKE :search', { search: `%${search}%` });
            }));
        }
        const items = await queryBuilder.getMany();
        const sessionStats = await this.getStudentSessionStats(items.map((student) => student.id));
        return {
            items: items.map((student) => this.buildStudentProfile(student, sessionStats.get(student.id))),
            total: items.length,
            branchId,
            packageIds,
        };
    }
    async getCycleStudents(query) {
        const classEntity = await this.classRepository.findOne({
            where: { id: query.classId },
            relations: [
                'branch',
                'teacher',
                'classStudents',
                'classStudents.student',
            ],
        });
        if (!classEntity) {
            throw new common_1.NotFoundException(`Class with id ${query.classId} not found`);
        }
        let selectedClassStudents = classEntity.classStudents ?? [];
        if (query.studentId) {
            selectedClassStudents = selectedClassStudents.filter((item) => item.studentId === query.studentId);
            if (selectedClassStudents.length === 0) {
                throw new common_1.BadRequestException(`studentId ${query.studentId} does not belong to class ${query.classId}`);
            }
        }
        const studentIds = selectedClassStudents.map((item) => item.studentId);
        const sessionsQuery = this.sessionRepository
            .createQueryBuilder('session')
            .where('session.classId = :classId', { classId: query.classId })
            .orderBy('session.sessionDate', 'ASC')
            .addOrderBy('session.startTime', 'ASC');
        const sessions = await sessionsQuery.getMany();
        const sessionIds = sessions.map((session) => session.id);
        let attendances = [];
        if (studentIds.length > 0 && sessionIds.length > 0) {
            attendances = await this.attendanceRepository
                .createQueryBuilder('attendance')
                .leftJoinAndSelect('attendance.session', 'session')
                .where('attendance.studentId IN (:...studentIds)', { studentIds })
                .andWhere('attendance.sessionId IN (:...sessionIds)', { sessionIds })
                .orderBy('session.sessionDate', 'ASC')
                .addOrderBy('session.startTime', 'ASC')
                .getMany();
        }
        const attendanceByStudent = new Map();
        attendances.forEach((attendance) => {
            const list = attendanceByStudent.get(attendance.studentId) ?? [];
            list.push(attendance);
            attendanceByStudent.set(attendance.studentId, list);
        });
        return {
            class: {
                id: classEntity.id,
                name: classEntity.name,
                status: classEntity.status,
                type: classEntity.type,
                roomName: classEntity.roomName,
                startDate: classEntity.startDate,
                startTime: classEntity.startTime,
                endTime: classEntity.endTime,
                weekdays: classEntity.weekdays,
                scheduleByWeekday: classEntity.scheduleByWeekday,
                branch: classEntity.branch
                    ? {
                        id: classEntity.branch.id,
                        name: classEntity.branch.name,
                    }
                    : null,
                teacher: classEntity.teacher
                    ? {
                        id: classEntity.teacher.id,
                        name: classEntity.teacher.name,
                    }
                    : null,
            },
            schedule: sessions,
            students: selectedClassStudents.map((classStudent) => ({
                id: classStudent.student.id,
                name: classStudent.student.name,
                phone: classStudent.student.phone,
                cycleStartDate: classStudent.student.cycleStartDate,
                attendances: attendanceByStudent.get(classStudent.studentId) ?? [],
            })),
            totalSessions: sessions.length,
            totalStudents: selectedClassStudents.length,
        };
    }
    async findAttendances(studentId, query) {
        await this.findStudentEntityById(studentId);
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.max(Number(query.limit) || 10, 1);
        const queryBuilder = this.attendanceRepository
            .createQueryBuilder('attendance')
            .leftJoinAndSelect('attendance.session', 'session')
            .leftJoinAndSelect('session.classEntity', 'classEntity')
            .leftJoinAndSelect('classEntity.branch', 'branch')
            .leftJoinAndSelect('classEntity.teacher', 'teacher')
            .leftJoinAndSelect('classEntity.classPackages', 'classPackages')
            .leftJoinAndSelect('classPackages.package', 'package')
            .where('attendance.studentId = :studentId', { studentId })
            .orderBy('session.sessionDate', 'DESC')
            .addOrderBy('session.startTime', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        if (query.classId) {
            const classId = Number(query.classId);
            if (!Number.isInteger(classId) || classId < 1) {
                throw new common_1.BadRequestException('classId must be a positive integer');
            }
            queryBuilder.andWhere('session.classId = :classId', { classId });
        }
        if (query.status) {
            queryBuilder.andWhere('attendance.status = :status', {
                status: query.status,
            });
        }
        const student = await this.studentRepository.findOne({
            where: { id: studentId },
            relations: ['classStudents', 'classStudents.classEntity'],
        });
        const studentClass = student?.classStudents?.map((item) => {
            return {
                id: item.classEntity.id,
                name: item.classEntity.name,
            };
        });
        const [items, total] = await queryBuilder.getManyAndCount();
        const normalizedItems = items.map((attendance) => this.normalizeAttendanceResponse(attendance));
        return {
            items: normalizedItems,
            studentClass,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async updateCycleStartDate(id, cycleStartDate) {
        const student = await this.findStudentEntityById(id);
        student.cycleStartDate = cycleStartDate;
        await this.studentRepository.save(student);
        return {
            message: `Student cycleStartDate updated to ${cycleStartDate}`,
            id,
        };
    }
    async updateParentZaloName(parentId, zaloName) {
        const parent = await this.parentRepository.findOne({
            where: { id: parentId },
        });
        if (!parent) {
            throw new common_1.NotFoundException(`Parent with id ${parentId} not found`);
        }
        parent.zaloName = zaloName;
        await this.parentRepository.save(parent);
        return {
            message: `Parent zaloName updated to ${zaloName}`,
            parentId,
        };
    }
    async updateIsCalled(id, isCalled) {
        const student = await this.findStudentEntityById(id);
        student.isCalled = isCalled;
        await this.studentRepository.save(student);
        return {
            message: `Student isCalled updated to ${isCalled}`,
            id,
        };
    }
    async updateIsTexted(id, isTexted) {
        const student = await this.findStudentEntityById(id);
        student.isTexted = isTexted;
        await this.studentRepository.save(student);
        return {
            message: `Student isTexted updated to ${isTexted}`,
            id,
        };
    }
    async updateIsPaidEnrollment(id, enrollmentId, data) {
        const { isPaid } = data;
        const enrollment = await this.enrollmentRepository.findOne({
            where: { id: enrollmentId, studentId: id },
        });
        if (!enrollment) {
            throw new common_1.NotFoundException(`Enrollment with id ${enrollmentId} for student ${id} not found`);
        }
        enrollment.isPaid = isPaid;
        await this.enrollmentRepository.save(enrollment);
        return {
            message: `Enrollment isPaid updated to ${isPaid}`,
            enrollmentId,
            studentId: id,
        };
    }
    async updateEnrollments(id, data) {
        const oldPackageId = Number(data.oldPackageId);
        const newPackageId = Number(data.newPackageId);
        const { isPaid } = data;
        if (!Number.isInteger(oldPackageId) || oldPackageId < 1) {
            throw new common_1.BadRequestException('oldPackageId must be a positive integer');
        }
        if (!Number.isInteger(newPackageId) || newPackageId < 1) {
            throw new common_1.BadRequestException('newPackageId must be a positive integer');
        }
        if (oldPackageId === newPackageId) {
            throw new common_1.BadRequestException('oldPackageId and newPackageId must be different');
        }
        return this.studentRepository.manager.transaction(async (manager) => {
            const student = await this.findStudentEntityById(id, manager);
            const oldEnrollment = student.enrollments.find((enrollment) => enrollment.packageId === oldPackageId);
            if (!oldEnrollment) {
                throw new common_1.NotFoundException(`Enrollment with packageId ${oldPackageId} for student ${id} not found`);
            }
            const duplicatedNewEnrollment = student.enrollments.find((enrollment) => enrollment.packageId === newPackageId);
            if (duplicatedNewEnrollment) {
                throw new common_1.BadRequestException('Gói mới đã tồn tại trong enrollments của học viên, không thể cập nhật');
            }
            const [oldPackage, newPackage] = await Promise.all([
                this.ensurePackagesExist([oldPackageId], manager).then((packages) => packages[0]),
                this.ensurePackagesExist([newPackageId], manager).then((packages) => packages[0]),
            ]);
            const learnedSessions = Number(oldPackage.totalSessions ?? 0) -
                Number(oldEnrollment.remainingSessions ?? 0);
            const nextRemainingSessions = Number(newPackage.totalSessions ?? 0) - learnedSessions;
            await manager.getRepository(enrollment_entity_1.Enrollment).update({ id: oldEnrollment.id }, {
                packageId: newPackageId,
                isPaid,
                remainingSessions: nextRemainingSessions,
            });
            const classStudents = await manager
                .getRepository(class_student_entity_1.ClassStudent)
                .find({ where: { studentId: id } });
            const classIds = classStudents.map((classStudent) => classStudent.classId);
            if (classIds.length > 0) {
                const classPackageRepository = manager.getRepository(class_packages_entity_1.ClassPackage);
                const classPackages = await classPackageRepository.find({
                    where: { classId: (0, typeorm_2.In)(classIds) },
                });
                const packageIdsByClassId = new Map();
                classPackages.forEach((classPackage) => {
                    const existingSet = packageIdsByClassId.get(classPackage.classId) ?? new Set();
                    existingSet.add(classPackage.packageId);
                    packageIdsByClassId.set(classPackage.classId, existingSet);
                });
                const classPackagesToCreate = [];
                classIds.forEach((classId) => {
                    const packageIds = packageIdsByClassId.get(classId) ?? new Set();
                    if (packageIds.has(oldPackageId) && !packageIds.has(newPackageId)) {
                        classPackagesToCreate.push(classPackageRepository.create({
                            classId,
                            packageId: newPackageId,
                        }));
                    }
                });
                if (classPackagesToCreate.length > 0) {
                    await classPackageRepository.save(classPackagesToCreate);
                }
            }
            const updatedStudent = await this.findStudentEntityById(id, manager);
            return this.buildStudentProfile(updatedStudent);
        });
    }
    async update(id, updateStudentDto) {
        return this.studentRepository.manager.transaction(async (manager) => {
            const student = await this.findStudentEntityById(id, manager);
            if (updateStudentDto.name !== undefined) {
                student.name = updateStudentDto.name;
            }
            if (updateStudentDto.addressDetail !== undefined) {
                student.addressDetail = updateStudentDto.addressDetail;
            }
            if (updateStudentDto.provinceCode !== undefined) {
                student.provinceCode = updateStudentDto.provinceCode;
            }
            if (updateStudentDto.wardCode !== undefined) {
                student.wardCode = updateStudentDto.wardCode;
            }
            if (updateStudentDto.provinceName !== undefined) {
                student.provinceName = updateStudentDto.provinceName;
            }
            if (updateStudentDto.wardName !== undefined) {
                student.wardName = updateStudentDto.wardName;
            }
            if (updateStudentDto.phone !== undefined) {
                student.phone = updateStudentDto.phone;
            }
            if (updateStudentDto.birthday !== undefined) {
                student.birthday = updateStudentDto.birthday;
            }
            if (updateStudentDto.branchId !== undefined) {
                const branch = await this.ensureBranchExists(updateStudentDto.branchId, manager);
                student.branch = branch;
                student.branchId = branch.id;
            }
            if (updateStudentDto.parents !== undefined) {
                student.parents = await this.resolveParents(updateStudentDto.parents, manager);
            }
            const studentRepository = manager.getRepository(student_entity_1.Student);
            await studentRepository.save(student);
            const updatedStudent = await this.findStudentEntityById(student.id, manager);
            return this.buildStudentProfile(updatedStudent);
        });
    }
    async renewCourse(id, renewStudentCourseDto) {
        const { isPaid, packageIds } = renewStudentCourseDto;
        const normalizedPackageIds = this.normalizeIds(packageIds);
        if (normalizedPackageIds.length === 0) {
            throw new common_1.BadRequestException('packageIds must contain at least one package id');
        }
        return this.studentRepository.manager.transaction(async (manager) => {
            await this.findStudentEntityById(id, manager);
            const packages = await this.ensurePackagesExist(normalizedPackageIds, manager);
            await this.appendEnrollments(manager, id, packages, isPaid);
            const updatedStudent = await this.findStudentEntityById(id, manager);
            return this.buildStudentProfile(updatedStudent);
        });
    }
    async remove(id) {
        return this.studentRepository.manager.transaction(async (manager) => {
            const student = await this.findStudentEntityById(id, manager);
            await this.softDeleteStudentRelations(manager, student.id);
            await manager.getRepository(student_entity_1.Student).softDelete(student.id);
            return {
                message: 'Student deleted successfully',
                id,
            };
        });
    }
    async restore(id) {
        return this.studentRepository.manager.transaction(async (manager) => {
            const student = await manager.getRepository(student_entity_1.Student).findOne({
                where: { id },
                withDeleted: true,
            });
            if (!student || !student.deletedAt) {
                throw new common_1.NotFoundException(`Student with id ${id} not found in trash`);
            }
            await this.restoreStudentRelations(manager, student.id);
            await manager.getRepository(student_entity_1.Student).restore(student.id);
            return {
                message: 'Student restored successfully',
                id,
            };
        });
    }
    async forceRemove(id) {
        return this.studentRepository.manager.transaction(async (manager) => {
            const student = await manager.getRepository(student_entity_1.Student).findOne({
                where: { id },
                withDeleted: true,
            });
            if (!student) {
                throw new common_1.NotFoundException(`Student with id ${id} not found`);
            }
            await this.forceDeleteStudentRelations(manager, student.id);
            await manager.getRepository(student_entity_1.Student).delete(student.id);
            return {
                message: 'Student permanently deleted successfully',
                id,
            };
        });
    }
    async findStudentEntityById(id, manager) {
        const studentRepository = manager?.getRepository(student_entity_1.Student) ?? this.studentRepository;
        const student = await studentRepository.findOne({
            where: { id },
            relations: ['branch', 'parents', 'enrollments', 'enrollments.package'],
        });
        if (!student) {
            throw new common_1.NotFoundException(`Student with id ${id} not found`);
        }
        return student;
    }
    async softDeleteStudentRelations(manager, studentId) {
        await manager.getRepository(attendance_entity_1.Attendance).softDelete({ studentId });
        await manager.getRepository(enrollment_entity_1.Enrollment).softDelete({ studentId });
        await manager.getRepository(class_student_entity_1.ClassStudent).softDelete({ studentId });
    }
    async restoreStudentRelations(manager, studentId) {
        await manager.getRepository(attendance_entity_1.Attendance).restore({ studentId });
        await manager.getRepository(enrollment_entity_1.Enrollment).restore({ studentId });
        await manager.getRepository(class_student_entity_1.ClassStudent).restore({ studentId });
    }
    async forceDeleteStudentRelations(manager, studentId) {
        await manager.getRepository(attendance_entity_1.Attendance).delete({ studentId });
        await manager.getRepository(enrollment_entity_1.Enrollment).delete({ studentId });
        await manager.getRepository(class_student_entity_1.ClassStudent).delete({ studentId });
    }
    async ensureBranchExists(branchId, manager) {
        const branchRepository = manager?.getRepository(branch_entity_1.Branch) ?? this.branchRepository;
        const branch = await branchRepository.findOne({
            where: { id: branchId },
        });
        if (!branch) {
            throw new common_1.BadRequestException(`Invalid branchId: ${branchId}`);
        }
        return branch;
    }
    normalizeIds(ids) {
        if (!ids || ids.length === 0) {
            return [];
        }
        return [...new Set(ids)];
    }
    parsePackageIdsFromQuery(packageIds) {
        const rawValues = Array.isArray(packageIds)
            ? packageIds
            : packageIds.split(',');
        const normalized = rawValues
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
            .map((value) => Number(value));
        if (normalized.some((value) => !Number.isInteger(value) || value < 1)) {
            throw new common_1.BadRequestException('packageIds must be a list of positive integers');
        }
        return [...new Set(normalized)];
    }
    async ensurePackagesExist(packageIds, manager) {
        if (packageIds.length === 0) {
            return [];
        }
        const packageRepository = manager?.getRepository(package_entity_1.Package) ?? this.packageRepository;
        const packages = await packageRepository.find({
            where: { id: (0, typeorm_2.In)(packageIds) },
            select: ['id', 'totalSessions', 'name'],
        });
        const foundIds = new Set(packages.map((packageEntity) => packageEntity.id));
        const missingIds = packageIds.filter((id) => !foundIds.has(id));
        if (missingIds.length > 0) {
            throw new common_1.BadRequestException(`Invalid packageIds: ${missingIds.join(', ')}`);
        }
        return packages;
    }
    async resolveParents(parentInputs, manager) {
        if (parentInputs.length === 0) {
            return [];
        }
        const parentRepository = manager?.getRepository(parent_entity_1.Parent) ?? this.parentRepository;
        const normalizedInputs = parentInputs.map((input) => ({
            ...input,
            name: input.name?.trim(),
            phone: input.phone?.trim(),
            email: input.email?.trim(),
        }));
        const existingParentIds = [
            ...new Set(normalizedInputs
                .map((input) => input.id)
                .filter((id) => id !== undefined)),
        ];
        const existingParents = existingParentIds.length > 0
            ? await parentRepository.find({ where: { id: (0, typeorm_2.In)(existingParentIds) } })
            : [];
        if (existingParents.length !== existingParentIds.length) {
            const foundIds = new Set(existingParents.map((parent) => parent.id));
            const missingIds = existingParentIds.filter((id) => !foundIds.has(id));
            throw new common_1.BadRequestException(`Invalid parent ids: ${missingIds.join(', ')}`);
        }
        const existingParentMap = new Map(existingParents.map((parent) => [parent.id, parent]));
        const phones = [
            ...new Set(normalizedInputs
                .map((input) => input.phone)
                .filter((phone) => Boolean(phone))),
        ];
        const parentsByPhone = phones.length > 0
            ? await parentRepository.find({ where: { phone: (0, typeorm_2.In)(phones) } })
            : [];
        const parentByPhoneMap = new Map();
        for (const parent of parentsByPhone) {
            const phone = parent.phone?.trim();
            if (!phone) {
                continue;
            }
            const duplicated = parentByPhoneMap.get(phone);
            if (duplicated && duplicated.id !== parent.id) {
                throw new common_1.BadRequestException(`Duplicated phone in database: ${phone}`);
            }
            parentByPhoneMap.set(phone, parent);
        }
        const modifiedParents = new Map();
        const resolvedParents = [];
        for (const input of normalizedInputs) {
            const inputPhone = input.phone;
            let targetParent;
            if (inputPhone) {
                targetParent = parentByPhoneMap.get(inputPhone);
            }
            if (!targetParent && input.id !== undefined) {
                targetParent = existingParentMap.get(input.id);
                if (!targetParent) {
                    throw new common_1.BadRequestException(`Invalid parent id: ${input.id}`);
                }
            }
            if (targetParent) {
                const oldPhone = targetParent.phone?.trim();
                let changed = false;
                if (input.name !== undefined && input.name !== targetParent.name) {
                    targetParent.name = input.name;
                    changed = true;
                }
                if (input.email !== undefined && input.email !== targetParent.email) {
                    targetParent.email = input.email;
                    changed = true;
                }
                if (inputPhone !== undefined && inputPhone !== targetParent.phone) {
                    targetParent.phone = inputPhone;
                    changed = true;
                }
                if (changed) {
                    modifiedParents.set(targetParent.id, targetParent);
                    if (oldPhone && oldPhone !== targetParent.phone) {
                        parentByPhoneMap.delete(oldPhone);
                    }
                    if (targetParent.phone) {
                        parentByPhoneMap.set(targetParent.phone, targetParent);
                    }
                }
                resolvedParents.push(targetParent);
                continue;
            }
            if (!input.name) {
                throw new common_1.BadRequestException('name is required when parent does not exist by id or phone');
            }
            const createdParent = await parentRepository.save(parentRepository.create({
                name: input.name,
                phone: inputPhone,
                email: input.email,
            }));
            if (createdParent.phone) {
                parentByPhoneMap.set(createdParent.phone, createdParent);
            }
            resolvedParents.push(createdParent);
        }
        if (modifiedParents.size > 0) {
            await parentRepository.save([...modifiedParents.values()]);
        }
        return this.uniqueParents(resolvedParents);
    }
    uniqueParents(parents) {
        const seenIds = new Set();
        return parents.filter((parent) => {
            if (seenIds.has(parent.id)) {
                return false;
            }
            seenIds.add(parent.id);
            return true;
        });
    }
    async syncEnrollments(manager, studentId, packages, isPaid = false) {
        const enrollmentRepository = manager.getRepository(enrollment_entity_1.Enrollment);
        await enrollmentRepository.delete({ studentId });
        if (packages.length === 0) {
            return;
        }
        const enrollments = packages.map((packageEntity) => enrollmentRepository.create({
            studentId,
            isPaid,
            packageId: packageEntity.id,
            remainingSessions: Number(packageEntity.totalSessions ?? 0),
        }));
        await enrollmentRepository.save(enrollments);
    }
    async appendEnrollments(manager, studentId, packages, isPaid = false) {
        if (packages.length === 0) {
            return;
        }
        const enrollmentRepository = manager.getRepository(enrollment_entity_1.Enrollment);
        const packageIds = packages.map((packageEntity) => packageEntity.id);
        const existingEnrollments = await enrollmentRepository.find({
            where: {
                studentId,
                packageId: (0, typeorm_2.In)(packageIds),
            },
        });
        const existingEnrollmentMap = new Map(existingEnrollments.map((enrollment) => [
            enrollment.packageId,
            enrollment,
        ]));
        const enrollments = packages.map((packageEntity) => {
            const packageSessions = Number(packageEntity.totalSessions ?? 0);
            const existing = existingEnrollmentMap.get(packageEntity.id);
            if (existing) {
                existing.remainingSessions += packageSessions;
                existing.isPaid = isPaid;
                return existing;
            }
            return enrollmentRepository.create({
                studentId,
                packageId: packageEntity.id,
                isPaid,
                remainingSessions: packageSessions,
            });
        });
        await enrollmentRepository.save(enrollments);
    }
    async getStudentSessionStats(studentIds) {
        const statsMap = new Map();
        if (studentIds.length === 0) {
            return statsMap;
        }
        const [learnedRows, remainingRows] = await Promise.all([
            this.attendanceRepository
                .createQueryBuilder('attendance')
                .select('attendance.studentId', 'studentId')
                .addSelect('COUNT(attendance.id)', 'learnedSessions')
                .where('attendance.studentId IN (:...studentIds)', { studentIds })
                .groupBy('attendance.studentId')
                .getRawMany(),
            this.enrollmentRepository
                .createQueryBuilder('enrollment')
                .select('enrollment.studentId', 'studentId')
                .addSelect('COALESCE(SUM(enrollment.remainingSessions), 0)', 'remainingSessions')
                .where('enrollment.studentId IN (:...studentIds)', { studentIds })
                .groupBy('enrollment.studentId')
                .getRawMany(),
        ]);
        studentIds.forEach((studentId) => {
            statsMap.set(studentId, {
                learnedSessions: 0,
                remainingSessions: 0,
            });
        });
        learnedRows.forEach((row) => {
            const studentId = Number(row.studentId);
            const current = statsMap.get(studentId) ?? {
                learnedSessions: 0,
                remainingSessions: 0,
            };
            current.learnedSessions = Number(row.learnedSessions ?? 0);
            statsMap.set(studentId, current);
        });
        remainingRows.forEach((row) => {
            const studentId = Number(row.studentId);
            const current = statsMap.get(studentId) ?? {
                learnedSessions: 0,
                remainingSessions: 0,
            };
            current.remainingSessions = Number(row.remainingSessions ?? 0);
            statsMap.set(studentId, current);
        });
        return statsMap;
    }
    buildStudentProfile(student, sessionStats) {
        const enrollments = student.enrollments ?? [];
        const packages = enrollments
            .map((enrollment) => enrollment.package)
            .filter((packageEntity) => Boolean(packageEntity));
        const remainingByPackage = enrollments
            .filter((enrollment) => Boolean(enrollment.package))
            .map((enrollment) => ({
            packageId: enrollment.packageId,
            packageName: enrollment.package?.name ?? null,
            remainingSessions: Number(enrollment.remainingSessions ?? 0),
        }));
        return {
            ...student,
            packageIds: packages.map((packageEntity) => packageEntity.id),
            packages,
            remainingByPackage,
            learnedSessions: sessionStats?.learnedSessions ?? 0,
            remainingSessions: remainingByPackage.reduce((sum, item) => sum + Number(item.remainingSessions ?? 0), 0) ||
                sessionStats?.remainingSessions ||
                0,
        };
    }
    normalizeAttendanceResponse(attendance) {
        if (!attendance.session?.classEntity) {
            return attendance;
        }
        const classEntity = attendance.session.classEntity;
        const packages = (classEntity.classPackages ?? [])
            .map((classPackage) => classPackage.package)
            .filter((packageEntity) => Boolean(packageEntity));
        const packageIds = packages.map((pkg) => pkg.id);
        const scheduleByWeekday = this.extractScheduleByWeekdayFromSessions([
            attendance.session,
        ]);
        return {
            ...attendance,
            session: {
                ...attendance.session,
                classEntity: {
                    ...classEntity,
                    packages,
                    packageIds,
                    scheduleByWeekday,
                    classPackages: undefined,
                },
            },
        };
    }
    extractScheduleByWeekdayFromSessions(sessions) {
        const scheduleByWeekday = {};
        sessions.forEach((session) => {
            if (!session.sessionDate || !session.startTime || !session.endTime) {
                return;
            }
            const weekday = new Date(session.sessionDate).getDay();
            if (!scheduleByWeekday[weekday]) {
                scheduleByWeekday[weekday] = {
                    startTime: session.startTime,
                    endTime: session.endTime,
                };
            }
        });
        return scheduleByWeekday;
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(branch_entity_1.Branch)),
    __param(2, (0, typeorm_1.InjectRepository)(parent_entity_1.Parent)),
    __param(3, (0, typeorm_1.InjectRepository)(package_entity_1.Package)),
    __param(4, (0, typeorm_1.InjectRepository)(enrollment_entity_1.Enrollment)),
    __param(5, (0, typeorm_1.InjectRepository)(attendance_entity_1.Attendance)),
    __param(6, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __param(7, (0, typeorm_1.InjectRepository)(class_entity_1.Class)),
    __param(8, (0, typeorm_1.InjectRepository)(class_student_entity_1.ClassStudent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService])
], StudentsService);
//# sourceMappingURL=students.service.js.map