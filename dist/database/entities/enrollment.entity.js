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
exports.Enrollment = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/base/base.entity");
const student_entity_1 = require("./student.entity");
const package_entity_1 = require("./package.entity");
let Enrollment = class Enrollment extends base_entity_1.BaseEntity {
    studentId;
    packageId;
    remainingSessions;
    isPaid;
    student;
    package;
};
exports.Enrollment = Enrollment;
__decorate([
    (0, typeorm_1.Column)({ name: 'student_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], Enrollment.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'package_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], Enrollment.prototype, "packageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'remaining_sessions', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], Enrollment.prototype, "remainingSessions", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'is_paid',
        type: 'boolean',
        default: false,
        nullable: false,
    }),
    __metadata("design:type", Boolean)
], Enrollment.prototype, "isPaid", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, (student) => student.enrollments, {
        nullable: false,
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", student_entity_1.Student)
], Enrollment.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => package_entity_1.Package, (pack) => pack.enrollments, {
        nullable: false,
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'package_id' }),
    __metadata("design:type", package_entity_1.Package)
], Enrollment.prototype, "package", void 0);
exports.Enrollment = Enrollment = __decorate([
    (0, typeorm_1.Entity)('enrollments')
], Enrollment);
//# sourceMappingURL=enrollment.entity.js.map