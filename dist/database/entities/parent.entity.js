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
exports.Parent = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/base/base.entity");
const student_entity_1 = require("./student.entity");
let Parent = class Parent extends base_entity_1.BaseEntity {
    name;
    zaloName;
    phone;
    email;
    students;
};
exports.Parent = Parent;
__decorate([
    (0, typeorm_1.Column)({ name: 'name', type: 'varchar', length: 255, nullable: false }),
    __metadata("design:type", String)
], Parent.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'zalo_name', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Parent.prototype, "zaloName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'phone', type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], Parent.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'email', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Parent.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => student_entity_1.Student, (student) => student.parents),
    __metadata("design:type", Array)
], Parent.prototype, "students", void 0);
exports.Parent = Parent = __decorate([
    (0, typeorm_1.Entity)('parents')
], Parent);
//# sourceMappingURL=parent.entity.js.map