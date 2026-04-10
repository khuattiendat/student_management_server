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
exports.ClassPackage = void 0;
const base_entity_1 = require("../../common/base/base.entity");
const typeorm_1 = require("typeorm");
const class_entity_1 = require("./class.entity");
const package_entity_1 = require("./package.entity");
let ClassPackage = class ClassPackage extends base_entity_1.BaseEntity {
    packageId;
    classId;
    classEntity;
    package;
};
exports.ClassPackage = ClassPackage;
__decorate([
    (0, typeorm_1.Column)({ name: 'package_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], ClassPackage.prototype, "packageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'class_id', type: 'int', nullable: false }),
    __metadata("design:type", Number)
], ClassPackage.prototype, "classId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => class_entity_1.Class, (classEntity) => classEntity.classPackages, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'class_id' }),
    __metadata("design:type", class_entity_1.Class)
], ClassPackage.prototype, "classEntity", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => package_entity_1.Package, (pac) => pac.classPackage, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'package_id' }),
    __metadata("design:type", package_entity_1.Package)
], ClassPackage.prototype, "package", void 0);
exports.ClassPackage = ClassPackage = __decorate([
    (0, typeorm_1.Entity)('class_packages'),
    (0, typeorm_1.Unique)(['classId', 'packageId'])
], ClassPackage);
//# sourceMappingURL=class_packages.entity.js.map