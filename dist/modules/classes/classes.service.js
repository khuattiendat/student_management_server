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
exports.ClassesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const class_entity_1 = require("../../database/entities/class.entity");
const branch_entity_1 = require("../../database/entities/branch.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const package_entity_1 = require("../../database/entities/package.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const class_student_entity_1 = require("../../database/entities/class_student.entity");
const session_entity_1 = require("../../database/entities/session.entity");
const attendance_entity_1 = require("../../database/entities/attendance.entity");
const class_packages_entity_1 = require("../../database/entities/class_packages.entity");
let ClassesService = class ClassesService {
    classRepository;
    branchRepository;
    userRepository;
    packageRepository;
    studentRepository;
    sessionRepository;
    constructor(classRepository, branchRepository, userRepository, packageRepository, studentRepository, sessionRepository) {
        this.classRepository = classRepository;
        this.branchRepository = branchRepository;
        this.userRepository = userRepository;
        this.packageRepository = packageRepository;
        this.studentRepository = studentRepository;
        this.sessionRepository = sessionRepository;
    }
    async create(createClassDto) {
        const studentIds = this.normalizeStudentIds(createClassDto.studentIds);
        const packageIds = this.normalizePackageIds(createClassDto.packageIds);
        return this.classRepository.manager.transaction(async (manager) => {
            const [branch, teacher] = await Promise.all([
                this.ensureBranchExists(createClassDto.branchId, manager),
                this.ensureTeacherExists(createClassDto.teacherId, manager),
            ]);
            const classType = createClassDto.type;
            let selectedPackage = null;
            if (packageIds.length > 0) {
                const packageEntities = await this.ensurePackagesExist(packageIds, manager);
                selectedPackage = this.selectSessionPackage(classType, packageEntities);
            }
            const normalizedWeekdays = this.normalizeWeekdays(createClassDto.weekdays);
            const scheduleByWeekday = this.normalizeScheduleByWeekday(createClassDto.scheduleByWeekday, normalizedWeekdays);
            const defaultSchedule = scheduleByWeekday[normalizedWeekdays[0]];
            const { studentIds: _studentIds, packageIds: _packageIds, scheduleByWeekday: _scheduleByWeekday, startDate, ...classPayload } = createClassDto;
            const classRepository = manager.getRepository(class_entity_1.Class);
            const classEntity = classRepository.create({
                ...classPayload,
                startDate: new Date(startDate),
                weekdays: normalizedWeekdays,
                startTime: defaultSchedule.startTime,
                endTime: defaultSchedule.endTime,
                type: classType,
                packageId: selectedPackage?.id ?? null,
                branch,
                teacher,
                scheduleByWeekday: this.toPersistedScheduleByWeekday(scheduleByWeekday),
            });
            const savedClass = await classRepository.save(classEntity);
            if (packageIds.length > 0) {
                await this.syncClassPackages(manager, savedClass.id, packageIds);
            }
            await this.createSessionsForClass(savedClass, selectedPackage, scheduleByWeekday, manager);
            if (studentIds.length > 0) {
                await this.ensureStudentsExist(studentIds, manager);
                await this.syncClassStudents(manager, savedClass.id, studentIds);
            }
            const createdClass = await this.findClassWithRelations(savedClass.id, manager);
            return this.toClassResponse(createdClass);
        });
    }
    async findAll(query, user) {
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.max(Number(query.limit) || 10, 1);
        const search = query.search?.trim();
        const isTeacher = user.role === user_entity_1.UserRole.TEACHER;
        const queryBuilder = this.classRepository
            .createQueryBuilder('class')
            .leftJoinAndSelect('class.branch', 'branch')
            .leftJoinAndSelect('class.teacher', 'teacher')
            .orderBy('class.id', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        if (isTeacher) {
            queryBuilder.where('class.teacherId = :teacherId', {
                teacherId: user.sub,
            });
        }
        if (search) {
            queryBuilder.andWhere(new typeorm_2.Brackets((builder) => {
                builder
                    .where('class.name LIKE :search', { search: `%${search}%` })
                    .orWhere('branch.name LIKE :search', { search: `%${search}%` })
                    .orWhere('teacher.name LIKE :search', { search: `%${search}%` });
            }));
        }
        if (query.status) {
            queryBuilder.andWhere('class.status = :status', {
                status: query.status,
            });
        }
        if (query.branchId) {
            const branchId = Number(query.branchId);
            if (!Number.isInteger(branchId) || branchId < 1) {
                throw new common_1.BadRequestException('branchId must be a positive integer');
            }
            queryBuilder.andWhere('class.branchId = :branchId', { branchId });
        }
        if (query.teacherId) {
            const teacherId = Number(query.teacherId);
            if (!Number.isInteger(teacherId) || teacherId < 1) {
                throw new common_1.BadRequestException('teacherId must be a positive integer');
            }
            queryBuilder.andWhere('class.teacherId = :teacherId', { teacherId });
        }
        if (query.packageId) {
            const packageId = Number(query.packageId);
            if (!Number.isInteger(packageId) || packageId < 1) {
                throw new common_1.BadRequestException('packageId must be a positive integer');
            }
            queryBuilder.andWhere(`EXISTS ${queryBuilder
                .subQuery()
                .select('1')
                .from(class_packages_entity_1.ClassPackage, 'classPackage')
                .where('classPackage.classId = class.id')
                .andWhere('classPackage.packageId = :packageId')
                .andWhere('classPackage.deletedAt IS NULL')
                .getQuery()}`, { packageId });
        }
        if (query.type) {
            queryBuilder.andWhere('class.type = :type', {
                type: query.type,
            });
        }
        const [items, total] = await queryBuilder.getManyAndCount();
        const itemIds = items.map((item) => item.id);
        const itemsWithStudents = itemIds.length > 0 ? await this.findManyByIdsWithRelations(itemIds) : [];
        const itemMap = new Map(itemsWithStudents.map((item) => [item.id, item]));
        const orderedItems = itemIds
            .map((id) => itemMap.get(id))
            .filter((item) => item !== undefined)
            .map((item) => this.toClassResponse(item));
        return {
            items: orderedItems,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findAllTrash(query) {
        const page = Math.max(Number(query.page) || 1, 1);
        const limit = Math.max(Number(query.limit) || 10, 1);
        const queryBuilder = this.classRepository
            .createQueryBuilder('class')
            .withDeleted()
            .where('class.deletedAt IS NOT NULL')
            .leftJoin('class.branch', 'branch')
            .select(['class.id', 'class.name', 'class.deletedAt', 'branch.name'])
            .orderBy('class.deletedAt', 'DESC')
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
    async findOne(id) {
        const classEntity = await this.findClassWithRelations(id);
        return this.toClassResponse(classEntity);
    }
    async update(id, updateClassDto) {
        const classEntity = await this.findClassWithRelations(id);
        const { studentIds, packageIds, scheduleByWeekday, ...updatePayload } = updateClassDto;
        const scheduleRelevantChanged = updateClassDto.weekdays !== undefined ||
            updateClassDto.scheduleByWeekday !== undefined ||
            updateClassDto.packageIds !== undefined ||
            updateClassDto.type !== undefined;
        const normalizedStudentIds = studentIds === undefined
            ? undefined
            : this.normalizeStudentIds(studentIds);
        const normalizedPackageIds = packageIds === undefined
            ? undefined
            : this.normalizePackageIds(packageIds);
        let effectivePackages = classEntity.classPackages?.map((classPackage) => classPackage.package) ??
            [];
        if (normalizedPackageIds !== undefined) {
            effectivePackages = await this.ensurePackagesExist(normalizedPackageIds);
        }
        if (updateClassDto.branchId !== undefined) {
            classEntity.branch = await this.ensureBranchExists(updateClassDto.branchId);
        }
        if (updateClassDto.teacherId !== undefined) {
            classEntity.teacher = await this.ensureTeacherExists(updateClassDto.teacherId);
        }
        const nextType = updateClassDto.type ?? classEntity.type;
        const selectedPackage = this.selectSessionPackage(nextType, effectivePackages);
        classEntity.packageId = selectedPackage?.id ?? null;
        const nextWeekdays = this.normalizeWeekdays(updateClassDto.weekdays ?? classEntity.weekdays);
        const effectiveScheduleByWeekday = this.resolveScheduleByWeekdayForUpdate(classEntity, nextWeekdays, scheduleByWeekday, scheduleRelevantChanged);
        const defaultSchedule = effectiveScheduleByWeekday[nextWeekdays[0]];
        classEntity.startTime = defaultSchedule.startTime;
        classEntity.endTime = defaultSchedule.endTime;
        classEntity.weekdays = nextWeekdays;
        classEntity.scheduleByWeekday = this.toPersistedScheduleByWeekday(effectiveScheduleByWeekday);
        Object.assign(classEntity, updatePayload);
        return this.classRepository.manager.transaction(async (manager) => {
            const classRepository = manager.getRepository(class_entity_1.Class);
            await classRepository.save(classEntity);
            if (normalizedPackageIds !== undefined) {
                await this.syncClassPackages(manager, id, normalizedPackageIds);
            }
            if (scheduleRelevantChanged) {
                await this.regenerateFutureSessions(classEntity, selectedPackage, effectiveScheduleByWeekday, manager);
            }
            if (normalizedStudentIds !== undefined) {
                await this.ensureStudentsExist(normalizedStudentIds, manager);
                await this.syncClassStudents(manager, id, normalizedStudentIds);
            }
            const updatedClass = await this.findClassWithRelations(id, manager);
            return this.toClassResponse(updatedClass);
        });
    }
    async remove(id) {
        return this.classRepository.manager.transaction(async (manager) => {
            const classEntity = await this.findClassWithRelations(id, manager);
            const classRepository = manager.getRepository(class_entity_1.Class);
            const sessionRepository = manager.getRepository(session_entity_1.Session);
            const classStudentRepository = manager.getRepository(class_student_entity_1.ClassStudent);
            const classPackageRepository = manager.getRepository(class_packages_entity_1.ClassPackage);
            const attendanceRepository = manager.getRepository(attendance_entity_1.Attendance);
            const sessions = await sessionRepository.find({
                where: { classId: id },
                select: ['id'],
            });
            const sessionIds = sessions.map((session) => session.id);
            await classStudentRepository.softDelete({ classId: id });
            await classPackageRepository.softDelete({ classId: id });
            if (sessionIds.length > 0) {
                await attendanceRepository.softDelete({
                    sessionId: (0, typeorm_2.In)(sessionIds),
                });
            }
            await sessionRepository.softDelete({ classId: id });
            await classRepository.softRemove(classEntity);
            return {
                message: 'Class deleted successfully',
                id,
            };
        });
    }
    async forceRemove(id) {
        return this.classRepository.manager.transaction(async (manager) => {
            const classRepository = manager.getRepository(class_entity_1.Class);
            const sessionRepository = manager.getRepository(session_entity_1.Session);
            const classStudentRepository = manager.getRepository(class_student_entity_1.ClassStudent);
            const classPackageRepository = manager.getRepository(class_packages_entity_1.ClassPackage);
            const attendanceRepository = manager.getRepository(attendance_entity_1.Attendance);
            const sessions = await sessionRepository.find({
                where: { classId: id },
                withDeleted: true,
                select: ['id'],
            });
            const sessionIds = sessions.map((session) => session.id);
            await classStudentRepository.delete({ classId: id });
            await classPackageRepository.delete({ classId: id });
            if (sessionIds.length > 0) {
                await attendanceRepository.delete({
                    sessionId: (0, typeorm_2.In)(sessionIds),
                });
            }
            await sessionRepository.delete({ classId: id });
            await classRepository.delete(id);
            return {
                message: 'Class permanently deleted successfully',
                id,
            };
        });
    }
    async restore(id) {
        return this.classRepository.manager.transaction(async (manager) => {
            const classRepository = manager.getRepository(class_entity_1.Class);
            const sessionRepository = manager.getRepository(session_entity_1.Session);
            const classStudentRepository = manager.getRepository(class_student_entity_1.ClassStudent);
            const classPackageRepository = manager.getRepository(class_packages_entity_1.ClassPackage);
            const attendanceRepository = manager.getRepository(attendance_entity_1.Attendance);
            const classEntity = await classRepository.findOne({
                where: { id },
                withDeleted: true,
            });
            if (!classEntity) {
                throw new common_1.NotFoundException(`Class with id ${id} not found`);
            }
            if (!classEntity.deletedAt) {
                throw new common_1.BadRequestException(`Class with id ${id} is not deleted`);
            }
            const sessions = await sessionRepository.find({
                where: { classId: id },
                withDeleted: true,
                select: ['id'],
            });
            const sessionIds = sessions.map((s) => s.id);
            await Promise.all([
                classRepository.restore(id),
                classStudentRepository.restore({ classId: id }),
                classPackageRepository.restore({ classId: id }),
                sessionRepository.restore({ classId: id }),
            ]);
            if (sessionIds.length > 0) {
                await attendanceRepository.restore({
                    sessionId: (0, typeorm_2.In)(sessionIds),
                });
            }
            return {
                message: 'Class restored successfully',
                id,
            };
        });
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
    async ensureTeacherExists(teacherId, manager) {
        const userRepository = manager?.getRepository(user_entity_1.User) ?? this.userRepository;
        const teacher = await userRepository.findOne({
            where: { id: teacherId },
        });
        if (!teacher) {
            throw new common_1.BadRequestException(`Invalid teacherId: ${teacherId}`);
        }
        if (teacher.role !== user_entity_1.UserRole.TEACHER) {
            throw new common_1.BadRequestException(`User ${teacherId} is not a teacher`);
        }
        return teacher;
    }
    async ensurePackageExists(packageId, manager) {
        const packageRepository = manager?.getRepository(package_entity_1.Package) ?? this.packageRepository;
        const packageEntity = await packageRepository.findOne({
            where: { id: packageId },
        });
        if (!packageEntity) {
            throw new common_1.BadRequestException(`Invalid packageId: ${packageId}`);
        }
        return packageEntity;
    }
    ensureClassTypeMatchesPackageType(classType, packageType) {
        if (classType !== packageType) {
            throw new common_1.BadRequestException('class type must match package type');
        }
    }
    toClassType(packageType) {
        switch (packageType) {
            case package_entity_1.PackageType.CERTIFICATE:
                return class_entity_1.ClassType.CERTIFICATE;
            case package_entity_1.PackageType.GENERAL:
                return class_entity_1.ClassType.GENERAL;
            case package_entity_1.PackageType.SCHOOL_SUBJECT:
                return class_entity_1.ClassType.SCHOOL_SUBJECT;
            default:
                throw new common_1.BadRequestException(`Unsupported package type: ${packageType}`);
        }
    }
    normalizeStudentIds(studentIds) {
        if (!studentIds || studentIds.length === 0) {
            return [];
        }
        return [...new Set(studentIds)];
    }
    normalizePackageIds(packageIds) {
        if (!packageIds || packageIds.length === 0) {
            return [];
        }
        return [...new Set(packageIds)];
    }
    async ensurePackagesExist(packageIds, manager) {
        if (packageIds.length === 0) {
            return [];
        }
        const packageRepository = manager?.getRepository(package_entity_1.Package) ?? this.packageRepository;
        const packages = await packageRepository.find({
            where: { id: (0, typeorm_2.In)(packageIds) },
        });
        const foundIds = new Set(packages.map((pkg) => pkg.id));
        const missingIds = packageIds.filter((id) => !foundIds.has(id));
        if (missingIds.length > 0) {
            throw new common_1.BadRequestException(`Invalid packageIds: ${missingIds.join(', ')}`);
        }
        return packages;
    }
    selectSessionPackage(classType, packages) {
        if (packages.length === 0) {
            return null;
        }
        if (classType === class_entity_1.ClassType.CERTIFICATE) {
            return packages.reduce((max, pkg) => {
                const maxSessions = Number(max.totalSessions ?? 0);
                const pkgSessions = Number(pkg.totalSessions ?? 0);
                return pkgSessions > maxSessions ? pkg : max;
            });
        }
        return packages[0] ?? null;
    }
    async syncClassPackages(manager, classId, packageIds) {
        const classPackageRepository = manager.getRepository(class_packages_entity_1.ClassPackage);
        await classPackageRepository.delete({ classId });
        if (packageIds.length === 0) {
            return;
        }
        const records = packageIds.map((packageId) => classPackageRepository.create({
            classId,
            packageId,
        }));
        await classPackageRepository.save(records);
    }
    async ensureStudentsExist(studentIds, manager) {
        if (studentIds.length === 0) {
            return;
        }
        const studentRepository = manager?.getRepository(student_entity_1.Student) ?? this.studentRepository;
        const students = await studentRepository.find({
            where: { id: (0, typeorm_2.In)(studentIds) },
            select: ['id'],
        });
        const foundIds = new Set(students.map((student) => student.id));
        const missingIds = studentIds.filter((id) => !foundIds.has(id));
        if (missingIds.length > 0) {
            throw new common_1.BadRequestException(`Invalid studentIds: ${missingIds.join(', ')}`);
        }
    }
    async syncClassStudents(manager, classId, studentIds) {
        const classStudentRepository = manager.getRepository(class_student_entity_1.ClassStudent);
        await classStudentRepository.delete({ classId });
        if (studentIds.length === 0) {
            return;
        }
        const records = studentIds.map((studentId) => classStudentRepository.create({
            classId,
            studentId,
        }));
        await classStudentRepository.save(records);
    }
    async createSessionsForClass(classEntity, packageEntity, scheduleByWeekday, manager) {
        const sessionDates = this.generateSessionDates(classEntity, packageEntity);
        if (sessionDates.length === 0) {
            return;
        }
        const sessionRepository = manager.getRepository(session_entity_1.Session);
        const sessions = sessionDates.map((sessionDate) => {
            const schedule = scheduleByWeekday[sessionDate.getDay()];
            if (!schedule) {
                throw new common_1.BadRequestException(`Missing schedule for weekday ${sessionDate.getDay()}`);
            }
            return {
                classId: classEntity.id,
                sessionDate,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
            };
        });
        await sessionRepository.insert(sessions);
    }
    async regenerateFutureSessions(classEntity, packageEntity, scheduleByWeekday, manager) {
        const sessionRepository = manager.getRepository(session_entity_1.Session);
        const effectiveFrom = this.toStartOfDay(new Date());
        const effectiveFromDateOnly = this.toDateOnlyString(effectiveFrom);
        const preservedPastSessionCount = await sessionRepository
            .createQueryBuilder('session')
            .where('session.classId = :classId', { classId: classEntity.id })
            .andWhere('session.sessionDate < :effectiveFrom', {
            effectiveFrom: effectiveFromDateOnly,
        })
            .getCount();
        await sessionRepository
            .createQueryBuilder()
            .delete()
            .from(session_entity_1.Session)
            .where('class_id = :classId', { classId: classEntity.id })
            .andWhere('session_date >= :effectiveFrom', {
            effectiveFrom: effectiveFromDateOnly,
        })
            .execute();
        const newFutureDates = this.generateFutureSessionDates(classEntity, packageEntity, effectiveFrom, preservedPastSessionCount);
        if (newFutureDates.length === 0) {
            return;
        }
        const newFutureSessions = newFutureDates.map((sessionDate) => {
            const schedule = scheduleByWeekday[sessionDate.getDay()];
            if (!schedule) {
                throw new common_1.BadRequestException(`Missing schedule for weekday ${sessionDate.getDay()}`);
            }
            return {
                classId: classEntity.id,
                sessionDate,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
            };
        });
        await sessionRepository.insert(newFutureSessions);
    }
    normalizeWeekdays(weekdays) {
        const normalized = [...new Set(weekdays)].sort((a, b) => a - b);
        if (normalized.length === 0) {
            throw new common_1.BadRequestException('weekdays must contain at least one day');
        }
        if (normalized.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
            throw new common_1.BadRequestException('weekdays must only contain values from 0 to 6');
        }
        return normalized;
    }
    normalizeScheduleByWeekday(scheduleByWeekdayInput, weekdays) {
        if (!scheduleByWeekdayInput || typeof scheduleByWeekdayInput !== 'object') {
            throw new common_1.BadRequestException('scheduleByWeekday is required');
        }
        const normalizedSchedule = {};
        Object.entries(scheduleByWeekdayInput).forEach(([weekdayKey, schedule]) => {
            const weekday = Number(weekdayKey);
            if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
                throw new common_1.BadRequestException(`scheduleByWeekday has invalid weekday key: ${weekdayKey}`);
            }
            if (!schedule || typeof schedule !== 'object') {
                throw new common_1.BadRequestException(`scheduleByWeekday[${weekday}] must be an object`);
            }
            const startTime = schedule.startTime?.trim();
            const endTime = schedule.endTime?.trim();
            if (!startTime || !endTime) {
                throw new common_1.BadRequestException(`scheduleByWeekday[${weekday}] requires startTime and endTime`);
            }
            this.validateMilitaryTime(startTime, `scheduleByWeekday[${weekday}].startTime`);
            this.validateMilitaryTime(endTime, `scheduleByWeekday[${weekday}].endTime`);
            this.validateTimeRange(startTime, endTime);
            normalizedSchedule[weekday] = {
                startTime,
                endTime,
            };
        });
        weekdays.forEach((weekday) => {
            if (!normalizedSchedule[weekday]) {
                throw new common_1.BadRequestException(`scheduleByWeekday is missing schedule for weekday ${weekday}`);
            }
        });
        return normalizedSchedule;
    }
    toPersistedScheduleByWeekday(scheduleByWeekday) {
        const persistedSchedule = {};
        Object.entries(scheduleByWeekday).forEach(([weekday, schedule]) => {
            persistedSchedule[String(weekday)] = {
                startTime: schedule.startTime,
                endTime: schedule.endTime,
            };
        });
        return persistedSchedule;
    }
    resolveScheduleByWeekdayForUpdate(classEntity, weekdays, scheduleByWeekdayInput, scheduleRelevantChanged) {
        if (scheduleByWeekdayInput) {
            return this.normalizeScheduleByWeekday(scheduleByWeekdayInput, weekdays);
        }
        const scheduleFromExistingSessions = this.extractScheduleFromSessions(classEntity.sessions ?? [], weekdays);
        const missingWeekdays = weekdays.filter((weekday) => !scheduleFromExistingSessions[weekday]);
        if (missingWeekdays.length > 0) {
            if (scheduleRelevantChanged) {
                throw new common_1.BadRequestException(`scheduleByWeekday is required for weekdays: ${missingWeekdays.join(', ')}`);
            }
            const fallbackStartTime = classEntity.startTime;
            const fallbackEndTime = classEntity.endTime;
            if (!fallbackStartTime || !fallbackEndTime) {
                throw new common_1.BadRequestException('scheduleByWeekday is required');
            }
            this.validateMilitaryTime(fallbackStartTime, 'startTime');
            this.validateMilitaryTime(fallbackEndTime, 'endTime');
            this.validateTimeRange(fallbackStartTime, fallbackEndTime);
            missingWeekdays.forEach((weekday) => {
                scheduleFromExistingSessions[weekday] = {
                    startTime: fallbackStartTime,
                    endTime: fallbackEndTime,
                };
            });
        }
        return scheduleFromExistingSessions;
    }
    extractScheduleFromSessions(sessions, weekdays) {
        const scheduleByWeekday = {};
        const sortedSessions = [...sessions].sort((a, b) => {
            const dateDiff = new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime();
            if (dateDiff !== 0) {
                return dateDiff;
            }
            return a.startTime.localeCompare(b.startTime);
        });
        sortedSessions.forEach((session) => {
            const weekday = new Date(session.sessionDate).getDay();
            if (scheduleByWeekday[weekday]) {
                return;
            }
            if (!session.startTime || !session.endTime) {
                return;
            }
            scheduleByWeekday[weekday] = {
                startTime: session.startTime,
                endTime: session.endTime,
            };
        });
        const resolved = {};
        weekdays.forEach((weekday) => {
            if (scheduleByWeekday[weekday]) {
                resolved[weekday] = scheduleByWeekday[weekday];
            }
        });
        return resolved;
    }
    generateFutureSessionDates(classEntity, packageEntity, effectiveFrom, preservedPastSessionCount) {
        const startDate = this.toStartOfDay(classEntity.startDate);
        const regenerateFrom = effectiveFrom > startDate ? new Date(effectiveFrom) : new Date(startDate);
        const weekdays = [...new Set(classEntity.weekdays)].sort((a, b) => a - b);
        if (weekdays.length === 0) {
            throw new common_1.BadRequestException('weekdays must contain at least one day');
        }
        if (classEntity.type === class_entity_1.ClassType.CERTIFICATE && packageEntity) {
            const totalSessions = Number(packageEntity.totalSessions ?? 0);
            if (!Number.isInteger(totalSessions) || totalSessions <= 0) {
                throw new common_1.BadRequestException('Certificate class requires package.totalSessions greater than 0');
            }
            const remainingSessions = Math.max(totalSessions - preservedPastSessionCount, 0);
            return this.collectMatchingDatesByCount(regenerateFrom, weekdays, remainingSessions);
        }
        const classEndDateExclusive = new Date(startDate);
        classEndDateExclusive.setFullYear(classEndDateExclusive.getFullYear() + 1);
        if (regenerateFrom >= classEndDateExclusive) {
            return [];
        }
        return this.collectMatchingDatesByRange(regenerateFrom, classEndDateExclusive, weekdays);
    }
    generateSessionDates(classEntity, packageEntity) {
        const weekdays = [...new Set(classEntity.weekdays)].sort((a, b) => a - b);
        if (weekdays.length === 0) {
            throw new common_1.BadRequestException('weekdays must contain at least one day');
        }
        const startDate = this.toStartOfDay(classEntity.startDate);
        if (classEntity.type === class_entity_1.ClassType.CERTIFICATE && packageEntity) {
            const totalSessions = Number(packageEntity.totalSessions ?? 0);
            if (!Number.isInteger(totalSessions) || totalSessions <= 0) {
                throw new common_1.BadRequestException('Certificate class requires package.totalSessions greater than 0');
            }
            return this.collectMatchingDatesByCount(startDate, weekdays, totalSessions);
        }
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
        return this.collectMatchingDatesByRange(startDate, endDate, weekdays);
    }
    collectMatchingDatesByCount(startDate, weekdays, targetCount) {
        const result = [];
        const cursor = new Date(startDate);
        while (result.length < targetCount) {
            if (weekdays.includes(cursor.getDay())) {
                result.push(new Date(cursor));
            }
            cursor.setDate(cursor.getDate() + 1);
        }
        return result;
    }
    collectMatchingDatesByRange(startDate, endDateExclusive, weekdays) {
        const result = [];
        const cursor = new Date(startDate);
        while (cursor < endDateExclusive) {
            if (weekdays.includes(cursor.getDay())) {
                result.push(new Date(cursor));
            }
            cursor.setDate(cursor.getDate() + 1);
        }
        return result;
    }
    toStartOfDay(dateInput) {
        if (dateInput instanceof Date) {
            if (Number.isNaN(dateInput.getTime())) {
                throw new common_1.BadRequestException('Invalid date input');
            }
            return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
        }
        if (typeof dateInput === 'string') {
            const trimmed = dateInput.trim();
            const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (dateOnlyMatch) {
                const year = Number(dateOnlyMatch[1]);
                const month = Number(dateOnlyMatch[2]);
                const day = Number(dateOnlyMatch[3]);
                return new Date(year, month - 1, day);
            }
            const parsed = new Date(trimmed);
            if (!Number.isNaN(parsed.getTime())) {
                return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
            }
        }
        throw new common_1.BadRequestException('Invalid date input');
    }
    toDateOnlyString(dateInput) {
        const year = dateInput.getFullYear();
        const month = `${dateInput.getMonth() + 1}`.padStart(2, '0');
        const day = `${dateInput.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    validateTimeRange(startTime, endTime) {
        const startMinutes = this.parseTimeToMinutes(startTime);
        const endMinutes = this.parseTimeToMinutes(endTime);
        if (endMinutes <= startMinutes) {
            throw new common_1.BadRequestException('endTime must be greater than startTime');
        }
    }
    validateMilitaryTime(value, fieldName) {
        const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!regex.test(value)) {
            throw new common_1.BadRequestException(`${fieldName} must be in HH:mm format`);
        }
    }
    parseTimeToMinutes(time) {
        const [hourStr, minuteStr] = time.split(':');
        const hour = Number(hourStr);
        const minute = Number(minuteStr);
        return hour * 60 + minute;
    }
    async findClassWithRelations(id, manager) {
        const classRepository = manager?.getRepository(class_entity_1.Class) ?? this.classRepository;
        const classEntity = await classRepository.findOne({
            where: { id },
            relations: [
                'branch',
                'teacher',
                'classPackages',
                'classPackages.package',
                'sessions',
                'classStudents',
                'classStudents.student',
            ],
        });
        if (!classEntity) {
            throw new common_1.NotFoundException(`Class with id ${id} not found`);
        }
        return classEntity;
    }
    async findManyByIdsWithRelations(ids) {
        return this.classRepository.find({
            where: { id: (0, typeorm_2.In)(ids) },
            relations: [
                'branch',
                'teacher',
                'classPackages',
                'classPackages.package',
                'sessions',
                'classStudents',
                'classStudents.student',
            ],
        });
    }
    toClassResponse(classEntity) {
        const students = (classEntity.classStudents ?? [])
            .map((classStudent) => classStudent.student)
            .filter((student) => Boolean(student));
        const packages = (classEntity.classPackages ?? [])
            .map((classPackage) => classPackage.package)
            .filter((packageEntity) => Boolean(packageEntity));
        const studentIds = students.map((student) => student.id);
        const packageIds = packages.map((packageEntity) => packageEntity.id);
        const { classStudents: _classStudents, classPackages: _classPackages, sessions: _sessions, ...classData } = classEntity;
        return {
            ...classData,
            students,
            studentIds,
            packages,
            packageIds,
        };
    }
};
exports.ClassesService = ClassesService;
exports.ClassesService = ClassesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(class_entity_1.Class)),
    __param(1, (0, typeorm_1.InjectRepository)(branch_entity_1.Branch)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(package_entity_1.Package)),
    __param(4, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(5, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ClassesService);
//# sourceMappingURL=classes.service.js.map