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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Class = exports.ClassType = exports.ClassStatus = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/base/base.entity");
const branch_entity_1 = require("./branch.entity");
const session_entity_1 = require("./session.entity");
const user_entity_1 = require("./user.entity");
const class_student_entity_1 = require("./class_student.entity");
const class_packages_entity_1 = require("./class_packages.entity");
var ClassStatus;
(function (ClassStatus) {
    ClassStatus["ACTIVE"] = "active";
    ClassStatus["INACTIVE"] = "inactive";
    ClassStatus["COMPLETED"] = "completed";
})(ClassStatus || (exports.ClassStatus = ClassStatus = {}));
var ClassType;
(function (ClassType) {
    ClassType["CERTIFICATE"] = "certificate";
    ClassType["GENERAL"] = "general";
    ClassType["SCHOOL_SUBJECT"] = "school_subject";
})(ClassType || (exports.ClassType = ClassType = {}));
let Class = class Class extends base_entity_1.BaseEntity {
    branchId;
    teacherId;
    packageId;
    type;
    name;
    roomName;
    status;
    startDate;
    startTime;
    endTime;
    weekdays;
    scheduleByWeekday;
    branch;
    teacher;
    classStudents;
    classPackages;
    sessions;
};
exports.Class = Class;
__decorate([
    (0, typeorm_1.Column)({ name: 'branch_id', type: 'int' }),
    __metadata("design:type", Number)
], Class.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'teacher_id', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Class.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'package_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Class.prototype, "packageId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'type',
        type: 'enum',
        enum: ClassType,
        default: ClassType.GENERAL,
    }),
    __metadata("design:type", String)
], Class.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name', type: 'varchar', length: 255, nullable: false }),
    __metadata("design:type", String)
], Class.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'room_name',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Class.prototype, "roomName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'status',
        type: 'enum',
        enum: ClassStatus,
        default: ClassStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], Class.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_date', type: 'date' }),
    __metadata("design:type", Date)
], Class.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_time', type: 'time', nullable: true }),
    __metadata("design:type", Object)
], Class.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_time', type: 'time', nullable: true }),
    __metadata("design:type", Object)
], Class.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'weekdays',
        type: 'varchar',
        transformer: {
            to: (value) => value.join(','),
            from: (value) => value?.split(',').map((day) => parseInt(day, 10)),
        },
    }),
    __metadata("design:type", Array)
], Class.prototype, "weekdays", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'schedule_by_weekday',
        type: 'json',
        nullable: true,
    }),
    __metadata("design:type", Object)
], Class.prototype, "scheduleByWeekday", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => branch_entity_1.Branch, (branch) => branch.classes, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'branch_id' }),
    __metadata("design:type", branch_entity_1.Branch)
], Class.prototype, "branch", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.classes, {
        onDelete: 'SET NULL',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'teacher_id' }),
    __metadata("design:type", Object)
], Class.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => class_student_entity_1.ClassStudent, (classStudent) => classStudent.classEntity),
    __metadata("design:type", Array)
], Class.prototype, "classStudents", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => class_packages_entity_1.ClassPackage, (classPackage) => classPackage.classEntity),
    __metadata("design:type", Array)
], Class.prototype, "classPackages", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => session_entity_1.Session, (session) => session.classEntity),
    __metadata("design:type", Array)
], Class.prototype, "sessions", void 0);
exports.Class = Class = __decorate([
    (0, typeorm_1.Entity)('classes')
], Class);
//# sourceMappingURL=class.entity.js.map