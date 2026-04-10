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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("../../database/entities/user.entity");
const branch_entity_1 = require("../../database/entities/branch.entity");
let AuthService = class AuthService {
    userRepository;
    branchRepository;
    jwtService;
    configService;
    constructor(userRepository, branchRepository, jwtService, configService) {
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(registerDto) {
        const existingUser = await this.userRepository.findOne({
            where: { userName: registerDto.userName },
            relations: ['branches'],
        });
        if (existingUser) {
            throw new common_1.ConflictException('Username already exists');
        }
        const password = await bcrypt.hash(registerDto.password, 10);
        const branchIds = [...new Set(registerDto.branchIds ?? [])];
        let branches = [];
        if (branchIds.length > 0) {
            branches = await this.branchRepository.find({
                where: { id: (0, typeorm_2.In)(branchIds) },
            });
            if (branches.length !== branchIds.length) {
                const foundIds = new Set(branches.map((branch) => branch.id));
                const missingBranchIds = branchIds.filter((id) => !foundIds.has(id));
                throw new common_1.BadRequestException(`Invalid branchIds: ${missingBranchIds.join(', ')}`);
            }
        }
        const user = this.userRepository.create({
            name: registerDto.name,
            userName: registerDto.userName,
            password,
            phone: registerDto.phone,
            branches,
        });
        const savedUser = await this.userRepository.save(user);
        const savedUserWithBranches = await this.userRepository.findOne({
            where: { id: savedUser.id },
            relations: ['branches'],
        });
        if (!savedUserWithBranches) {
            throw new common_1.UnauthorizedException('User not found after register');
        }
        return {
            user: this.buildUserProfile(savedUserWithBranches),
        };
    }
    async login(loginDto) {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.user_name = :userName', { userName: loginDto.userName })
            .leftJoinAndSelect('user.branches', 'branches')
            .getOne();
        if (!user) {
            throw new common_1.BadRequestException('Invalid username or password');
        }
        const isMatch = await bcrypt.compare(loginDto.password, user.password);
        if (!isMatch) {
            throw new common_1.BadRequestException('Invalid username or password');
        }
        if (user.status === user_entity_1.UserStatus.INACTIVE) {
            throw new common_1.BadRequestException('User is inactive');
        }
        const tokens = await this.generateTokens(user);
        return {
            user: this.buildUserProfile(user),
            ...tokens,
        };
    }
    async refreshToken(refreshToken) {
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Refresh token is required');
        }
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET') ||
                    'refresh-secret-key',
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const user = await this.userRepository.findOne({
            where: { id: payload.sub },
        });
        if (!user || user.status === user_entity_1.UserStatus.INACTIVE) {
            throw new common_1.UnauthorizedException('User not found or inactive');
        }
        const tokens = await this.generateTokens(user);
        return {
            ...tokens,
        };
    }
    logout(refreshToken) {
        return {
            message: 'Logged out successfully',
        };
    }
    async profile(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId, status: user_entity_1.UserStatus.ACTIVE },
            relations: ['branches'],
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return this.buildUserProfile(user);
    }
    async changePassword(userId, changePasswordDto) {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .leftJoinAndSelect('user.branches', 'branches')
            .where('user.id = :userId', { userId })
            .getOne();
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const isCurrentPasswordMatch = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
        if (!isCurrentPasswordMatch) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const isSamePassword = await bcrypt.compare(changePasswordDto.newPassword, user.password);
        if (isSamePassword) {
            throw new common_1.BadRequestException('New password must be different from current password');
        }
        const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
        await this.userRepository.update(user.id, {
            password: hashedNewPassword,
        });
        return {
            message: 'Password changed successfully',
        };
    }
    async changePasswordAdmin(changePasswordAdminDto) {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.id = :teacherId', {
            teacherId: changePasswordAdminDto.teacherId,
        })
            .getOne();
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const hashedNewPassword = await bcrypt.hash(changePasswordAdminDto.newPassword, 10);
        await this.userRepository.update(user.id, {
            password: hashedNewPassword,
        });
        return {
            message: 'Password changed successfully',
        };
    }
    async updateProfile(userId, updateProfileDto) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['branches'],
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (updateProfileDto.name !== undefined) {
            user.name = updateProfileDto.name;
        }
        if (updateProfileDto.phone !== undefined) {
            user.phone = updateProfileDto.phone;
        }
        const updatedUser = await this.userRepository.save(user);
        return this.buildUserProfile(updatedUser);
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            userName: user.userName,
            role: user.role,
        };
        const accessExpiresIn = (this.configService.get('JWT_ACCESS_EXPIRES') || '15m');
        const refreshExpiresIn = (this.configService.get('JWT_REFRESH_EXPIRES') || '7d');
        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_ACCESS_SECRET') ||
                'access-secret-key',
            expiresIn: accessExpiresIn,
        });
        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET') ||
                'refresh-secret-key',
            expiresIn: refreshExpiresIn,
        });
        return {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
        };
    }
    buildUserProfile(user) {
        const branches = user.branches?.map((branch) => ({
            id: branch.id,
            name: branch.name,
        })) || [];
        return {
            id: user.id,
            name: user.name,
            userName: user.userName,
            phone: user.phone,
            branches,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(branch_entity_1.Branch)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map