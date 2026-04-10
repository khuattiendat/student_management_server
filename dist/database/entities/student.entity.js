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
exports.Student = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/base/base.entity");
const branch_entity_1 = require("./branch.entity");
const enrollment_entity_1 = require("./enrollment.entity");
const attendance_entity_1 = require("./attendance.entity");
const parent_entity_1 = require("./parent.entity");
const class_student_entity_1 = require("./class_student.entity");
const student_remainings_entity_1 = require("./student_remainings.entity");
let Student = class Student extends base_entity_1.BaseEntity {
    branchId;
    name;
    isCalled;
    isTexted;
    cycleStartDate;
    birthday;
    addressDetail;
    provinceCode;
    wardCode;
    provinceName;
    wardName;
    phone;
    deletedByBranchId;
    branch;
    enrollments;
    attendances;
    parents;
    classStudents;
    remainings;
};
exports.Student = Student;
__decorate([
    (0, typeorm_1.Column)({
        name: 'branch_id',
        type: 'int',
        nullable: true,
    }),
    __metadata("design:type", Object)
], Student.prototype, "branchId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: false,
        length: 255,
        name: 'name',
    }),
    __metadata("design:type", String)
], Student.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: false,
        name: 'is_called',
        default: false,
    }),
    __metadata("design:type", Boolean)
], Student.prototype, "isCalled", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: false,
        name: 'is_texted',
        default: false,
    }),
    __metadata("design:type", Boolean)
], Student.prototype, "isTexted", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: true,
        name: 'cycle_start_date',
        type: 'date',
    }),
    __metadata("design:type", Object)
], Student.prototype, "cycleStartDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: true,
        name: 'birthday',
        type: 'varchar',
    }),
    __metadata("design:type", String)
], Student.prototype, "birthday", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'address_detail',
        nullable: true,
        length: 255,
    }),
    __metadata("design:type", String)
], Student.prototype, "addressDetail", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'province_code',
        nullable: true,
    }),
    __metadata("design:type", Number)
], Student.prototype, "provinceCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'ward_code',
        nullable: true,
    }),
    __metadata("design:type", Number)
], Student.prototype, "wardCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'province_name',
        nullable: true,
        length: 255,
    }),
    __metadata("design:type", String)
], Student.prototype, "provinceName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'ward_name',
        nullable: true,
        length: 255,
    }),
    __metadata("design:type", String)
], Student.prototype, "wardName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: true,
        name: 'phone',
        length: 20,
    }),
    __metadata("design:type", String)
], Student.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'deletedBy_branch_id',
        nullable: true,
        type: 'int',
    }),
    __metadata("design:type", Object)
], Student.prototype, "deletedByBranchId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => branch_entity_1.Branch, (branch) => branch.students, {
        nullable: true,
        onDelete: 'SET NULL',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'branch_id' }),
    __metadata("design:type", Object)
], Student.prototype, "branch", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => enrollment_entity_1.Enrollment, (enrollment) => enrollment.student),
    __metadata("design:type", Array)
], Student.prototype, "enrollments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => attendance_entity_1.Attendance, (attendance) => attendance.student, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Student.prototype, "attendances", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => parent_entity_1.Parent, (parent) => parent.students, {
        cascade: true,
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinTable)({
        name: 'student_parents',
        joinColumn: {
            name: 'student_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'parent_id',
            referencedColumnName: 'id',
        },
    }),
    __metadata("design:type", Array)
], Student.prototype, "parents", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => class_student_entity_1.ClassStudent, (classStudent) => classStudent.student),
    __metadata("design:type", Array)
], Student.prototype, "classStudents", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => student_remainings_entity_1.StudentRemainings, (remainings) => remainings.student),
    __metadata("design:type", Array)
], Student.prototype, "remainings", void 0);
exports.Student = Student = __decorate([
    (0, typeorm_1.Entity)('students')
], Student);
//# sourceMappingURL=student.entity.js.map