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
exports.StudentRemainings = void 0;
const base_entity_1 = require("../../common/base/base.entity");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
let StudentRemainings = class StudentRemainings extends base_entity_1.BaseEntity {
    studentId;
    remainingSessions;
    student;
};
exports.StudentRemainings = StudentRemainings;
__decorate([
    (0, typeorm_1.Column)({ name: 'student_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], StudentRemainings.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'remaining_sessions', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], StudentRemainings.prototype, "remainingSessions", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, (student) => student.remainings, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", student_entity_1.Student)
], StudentRemainings.prototype, "student", void 0);
exports.StudentRemainings = StudentRemainings = __decorate([
    (0, typeorm_1.Entity)('student_remainings')
], StudentRemainings);
//# sourceMappingURL=student_remainings.entity.js.map