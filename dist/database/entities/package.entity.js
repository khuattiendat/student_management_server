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
exports.Package = exports.ClassTYpe = exports.Subject = exports.CertificateType = exports.ComboType = exports.Curriculum = exports.PackageType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../common/base/base.entity");
const enrollment_entity_1 = require("./enrollment.entity");
const class_packages_entity_1 = require("./class_packages.entity");
var PackageType;
(function (PackageType) {
    PackageType["CERTIFICATE"] = "certificate";
    PackageType["GENERAL"] = "general";
    PackageType["SCHOOL_SUBJECT"] = "school_subject";
})(PackageType || (exports.PackageType = PackageType = {}));
var Curriculum;
(function (Curriculum) {
    Curriculum["ENGLISH"] = "english";
    Curriculum["CHINESE"] = "chinese";
})(Curriculum || (exports.Curriculum = Curriculum = {}));
var ComboType;
(function (ComboType) {
    ComboType["STANDARD"] = "standard";
    ComboType["BREAKTHROUGH"] = "breakthrough";
    ComboType["ACCOMPANYING"] = "accompanying";
})(ComboType || (exports.ComboType = ComboType = {}));
var CertificateType;
(function (CertificateType) {
    CertificateType["IELTS"] = "ielts";
    CertificateType["TOEIC"] = "toeic";
    CertificateType["HSK"] = "hsk";
    CertificateType["YCT"] = "yct";
})(CertificateType || (exports.CertificateType = CertificateType = {}));
var Subject;
(function (Subject) {
    Subject["VAN"] = "van";
    Subject["TOAN"] = "toan";
    Subject["TIENG_VIET"] = "tieng_viet";
    Subject["THE_DUC"] = "the_duc";
    Subject["HOA"] = "hoa";
    Subject["VAT_LY"] = "vat_ly";
    Subject["MA_THUAT_HAC_AM"] = "ma_thuat_hac_am";
    Subject["GDCD"] = "gdcd";
    Subject["DAO_DUC"] = "dao_duc";
    Subject["THE_THUAT"] = "the_thuat";
    Subject["TU_NHIEN_XA_HOI"] = "tu_nhien_xa_hoi";
    Subject["LICH_SU"] = "lich_su";
    Subject["NHAN_THUAT"] = "nhan_thuat";
    Subject["DIA_LY"] = "dia_ly";
})(Subject || (exports.Subject = Subject = {}));
var ClassTYpe;
(function (ClassTYpe) {
    ClassTYpe["LOP_1"] = "lop_1";
    ClassTYpe["LOP_2"] = "lop_2";
    ClassTYpe["LOP_3"] = "lop_3";
    ClassTYpe["LOP_4"] = "lop_4";
    ClassTYpe["LOP_5"] = "lop_5";
    ClassTYpe["LOP_6"] = "lop_6";
    ClassTYpe["LOP_7"] = "lop_7";
    ClassTYpe["LOP_8"] = "lop_8";
    ClassTYpe["LOP_9"] = "lop_9";
    ClassTYpe["LOP_10"] = "lop_10";
    ClassTYpe["LOP_11"] = "lop_11";
    ClassTYpe["LOP_12"] = "lop_12";
})(ClassTYpe || (exports.ClassTYpe = ClassTYpe = {}));
let Package = class Package extends base_entity_1.BaseEntity {
    name;
    totalSessions;
    price;
    type;
    info;
    enrollments;
    classPackage;
};
exports.Package = Package;
__decorate([
    (0, typeorm_1.Column)({ name: 'name', type: 'varchar', length: 255, nullable: false }),
    __metadata("design:type", String)
], Package.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_sessions', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Package.prototype, "totalSessions", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'price',
        type: 'decimal',
        precision: 12,
        scale: 2,
        nullable: false,
    }),
    __metadata("design:type", String)
], Package.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'type',
        type: 'enum',
        enum: PackageType,
        nullable: false,
        default: PackageType.CERTIFICATE,
    }),
    __metadata("design:type", String)
], Package.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'info',
        type: 'json',
        nullable: true,
    }),
    __metadata("design:type", Object)
], Package.prototype, "info", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => enrollment_entity_1.Enrollment, (enrollment) => enrollment.package),
    __metadata("design:type", Array)
], Package.prototype, "enrollments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => class_packages_entity_1.ClassPackage, (classPackage) => classPackage.package),
    __metadata("design:type", Array)
], Package.prototype, "classPackage", void 0);
exports.Package = Package = __decorate([
    (0, typeorm_1.Entity)('packages')
], Package);
//# sourceMappingURL=package.entity.js.map