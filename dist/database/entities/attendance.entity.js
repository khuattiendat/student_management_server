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
exports.Attendance = exports.AttendanceStatus = void 0;
const typeorm_1 = require("typeorm");
const session_entity_1 = require("./session.entity");
const student_entity_1 = require("./student.entity");
const base_entity_1 = require("../../common/base/base.entity");
var AttendanceStatus;
(function (AttendanceStatus) {
    AttendanceStatus["PRESENT"] = "present";
    AttendanceStatus["LATE"] = "late";
    AttendanceStatus["EXCUSED_ABSENT"] = "excused_absent";
    AttendanceStatus["UNEXCUSED_ABSENT"] = "unexcused_absent";
    AttendanceStatus["LATE_CANCEL_ABSENT"] = "late_cancel_absent";
})(AttendanceStatus || (exports.AttendanceStatus = AttendanceStatus = {}));
let Attendance = class Attendance extends base_entity_1.BaseEntity {
    sessionId;
    studentId;
    status;
    rate;
    session;
    student;
};
exports.Attendance = Attendance;
__decorate([
    (0, typeorm_1.Column)({ name: 'session_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], Attendance.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], Attendance.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'status',
        type: 'enum',
        enum: AttendanceStatus,
        nullable: false,
    }),
    __metadata("design:type", String)
], Attendance.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rate', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Attendance.prototype, "rate", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => session_entity_1.Session, (session) => session.attendances, {
        nullable: false,
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'session_id' }),
    __metadata("design:type", session_entity_1.Session)
], Attendance.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, (student) => student.attendances, {
        nullable: false,
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", student_entity_1.Student)
], Attendance.prototype, "student", void 0);
exports.Attendance = Attendance = __decorate([
    (0, typeorm_1.Entity)('attendances'),
    (0, typeorm_1.Index)(['sessionId', 'studentId'], { unique: true })
], Attendance);
//# sourceMappingURL=attendance.entity.js.map