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
exports.TeacherCode = void 0;
const base_entity_1 = require("../../common/base/base.entity");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let TeacherCode = class TeacherCode extends base_entity_1.BaseEntity {
    code;
    expiresAt;
    isUsed;
    teacherId;
    teacher;
};
exports.TeacherCode = TeacherCode;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: false, unique: true }),
    __metadata("design:type", String)
], TeacherCode.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at', type: 'timestamp', nullable: false }),
    __metadata("design:type", Date)
], TeacherCode.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'is_used',
        type: 'boolean',
        default: false,
        nullable: false,
    }),
    __metadata("design:type", Boolean)
], TeacherCode.prototype, "isUsed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'teacher_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], TeacherCode.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (teacher) => teacher.code, {
        onDelete: 'CASCADE',
    }),
    __metadata("design:type", user_entity_1.User)
], TeacherCode.prototype, "teacher", void 0);
exports.TeacherCode = TeacherCode = __decorate([
    (0, typeorm_1.Entity)('teacher_code')
], TeacherCode);
//# sourceMappingURL=teacherCode.entity.js.map