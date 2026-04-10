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
exports.QueryClassDto = void 0;
const class_validator_1 = require("class-validator");
const base_QueryDto_1 = require("../../../common/base/base.QueryDto");
const class_entity_1 = require("../../../database/entities/class.entity");
class QueryClassDto extends base_QueryDto_1.BaseQueryDto {
    branchId;
    teacherId;
    packageId;
    type;
    status;
}
exports.QueryClassDto = QueryClassDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryClassDto.prototype, "branchId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryClassDto.prototype, "teacherId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryClassDto.prototype, "packageId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(class_entity_1.ClassType),
    __metadata("design:type", String)
], QueryClassDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(class_entity_1.ClassStatus),
    __metadata("design:type", String)
], QueryClassDto.prototype, "status", void 0);
//# sourceMappingURL=query-class.dto.js.map