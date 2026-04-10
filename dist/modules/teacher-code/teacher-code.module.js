"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeacherCodeModule = void 0;
const teacherCode_entity_1 = require("../../database/entities/teacherCode.entity");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const teacher_code_controller_1 = require("./teacher-code.controller");
const teacher_code_service_1 = require("./teacher-code.service");
const auth_module_1 = require("../auth/auth.module");
const user_entity_1 = require("../../database/entities/user.entity");
let TeacherCodeModule = class TeacherCodeModule {
};
exports.TeacherCodeModule = TeacherCodeModule;
exports.TeacherCodeModule = TeacherCodeModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([teacherCode_entity_1.TeacherCode, user_entity_1.User]), auth_module_1.AuthModule],
        controllers: [teacher_code_controller_1.TeacherCodeController],
        providers: [teacher_code_service_1.TeacherCodeService],
        exports: [teacher_code_service_1.TeacherCodeService],
    })
], TeacherCodeModule);
//# sourceMappingURL=teacher-code.module.js.map