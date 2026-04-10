"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const class_entity_1 = require("../../database/entities/class.entity");
const branch_entity_1 = require("../../database/entities/branch.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const package_entity_1 = require("../../database/entities/package.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const session_entity_1 = require("../../database/entities/session.entity");
const classes_controller_1 = require("./classes.controller");
const classes_service_1 = require("./classes.service");
const auth_module_1 = require("../auth/auth.module");
let ClassesModule = class ClassesModule {
};
exports.ClassesModule = ClassesModule;
exports.ClassesModule = ClassesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([class_entity_1.Class, branch_entity_1.Branch, user_entity_1.User, package_entity_1.Package, student_entity_1.Student, session_entity_1.Session]),
            auth_module_1.AuthModule,
        ],
        controllers: [classes_controller_1.ClassesController],
        providers: [classes_service_1.ClassesService],
        exports: [classes_service_1.ClassesService],
    })
], ClassesModule);
//# sourceMappingURL=classes.module.js.map