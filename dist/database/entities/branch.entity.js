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
exports.Branch = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/base/base.entity");
const user_entity_1 = require("./user.entity");
const student_entity_1 = require("./student.entity");
const class_entity_1 = require("./class.entity");
let Branch = class Branch extends base_entity_1.BaseEntity {
    name;
    address;
    phone;
    managedUsers;
    students;
    classes;
};
exports.Branch = Branch;
__decorate([
    (0, typeorm_1.Column)({
        nullable: false,
        length: 255,
        name: 'name',
    }),
    __metadata("design:type", String)
], Branch.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: true,
        length: 255,
        name: 'address',
    }),
    __metadata("design:type", String)
], Branch.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: true,
        length: 255,
        name: 'phone',
    }),
    __metadata("design:type", String)
], Branch.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => user_entity_1.User, (user) => user.branches),
    __metadata("design:type", Array)
], Branch.prototype, "managedUsers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => student_entity_1.Student, (student) => student.branch),
    __metadata("design:type", Array)
], Branch.prototype, "students", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => class_entity_1.Class, (classEntity) => classEntity.branch),
    __metadata("design:type", Array)
], Branch.prototype, "classes", void 0);
exports.Branch = Branch = __decorate([
    (0, typeorm_1.Entity)('branches')
], Branch);
//# sourceMappingURL=branch.entity.js.map