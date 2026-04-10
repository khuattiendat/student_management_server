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
exports.ClassStudent = void 0;
const base_entity_1 = require("../../common/base/base.entity");
const typeorm_1 = require("typeorm");
const class_entity_1 = require("./class.entity");
const student_entity_1 = require("./student.entity");
let ClassStudent = class ClassStudent extends base_entity_1.BaseEntity {
    classId;
    studentId;
    classEntity;
    student;
};
exports.ClassStudent = ClassStudent;
__decorate([
    (0, typeorm_1.Column)({ name: 'class_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], ClassStudent.prototype, "classId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], ClassStudent.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => class_entity_1.Class, (classEntity) => classEntity.classStudents, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'class_id' }),
    __metadata("design:type", class_entity_1.Class)
], ClassStudent.prototype, "classEntity", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, (student) => student.classStudents, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", student_entity_1.Student)
], ClassStudent.prototype, "student", void 0);
exports.ClassStudent = ClassStudent = __decorate([
    (0, typeorm_1.Entity)('class_students'),
    (0, typeorm_1.Unique)(['classId', 'studentId'])
], ClassStudent);
//# sourceMappingURL=class_student.entity.js.map