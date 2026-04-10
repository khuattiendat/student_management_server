"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const student_entity_1 = require("../../database/entities/student.entity");
const parent_entity_1 = require("../../database/entities/parent.entity");
const branch_entity_1 = require("../../database/entities/branch.entity");
const package_entity_1 = require("../../database/entities/package.entity");
const enrollment_entity_1 = require("../../database/entities/enrollment.entity");
const session_entity_1 = require("../../database/entities/session.entity");
const class_student_entity_1 = require("../../database/entities/class_student.entity");
const students_controller_1 = require("./students.controller");
const students_service_1 = require("./students.service");
const auth_module_1 = require("../auth/auth.module");
const attendance_entity_1 = require("../../database/entities/attendance.entity");
const class_entity_1 = require("../../database/entities/class.entity");
let StudentsModule = class StudentsModule {
};
exports.StudentsModule = StudentsModule;
exports.StudentsModule = StudentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                student_entity_1.Student,
                parent_entity_1.Parent,
                branch_entity_1.Branch,
                package_entity_1.Package,
                enrollment_entity_1.Enrollment,
                attendance_entity_1.Attendance,
                session_entity_1.Session,
                class_student_entity_1.ClassStudent,
                class_entity_1.Class,
            ]),
            auth_module_1.AuthModule,
        ],
        controllers: [students_controller_1.StudentsController],
        providers: [students_service_1.StudentsService],
        exports: [students_service_1.StudentsService],
    })
], StudentsModule);
//# sourceMappingURL=students.module.js.map