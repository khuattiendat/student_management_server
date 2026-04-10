import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole, UserStatus } from '@/database/entities/user.entity';
import { Branch } from '@/database/entities/branch.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePassworAdmindDto } from './dto/change-password-admin.dto';
export declare class AuthService {
    private readonly userRepository;
    private readonly branchRepository;
    private readonly jwtService;
    private readonly configService;
    constructor(userRepository: Repository<User>, branchRepository: Repository<Branch>, jwtService: JwtService, configService: ConfigService);
    register(registerDto: RegisterDto): Promise<{
        user: {
            id: number;
            name: string;
            userName: string;
            phone: string;
            branches: {
                id: number;
                name: string;
            }[];
            role: UserRole;
            status: UserStatus;
            createdAt: Date | null;
            updatedAt: Date | null;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        user: {
            id: number;
            name: string;
            userName: string;
            phone: string;
            branches: {
                id: number;
                name: string;
            }[];
            role: UserRole;
            status: UserStatus;
            createdAt: Date | null;
            updatedAt: Date | null;
        };
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
    }>;
    logout(refreshToken: string): {
        message: string;
    };
    profile(userId: number): Promise<{
        id: number;
        name: string;
        userName: string;
        phone: string;
        branches: {
            id: number;
            name: string;
        }[];
        role: UserRole;
        status: UserStatus;
        createdAt: Date | null;
        updatedAt: Date | null;
    }>;
    changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    changePasswordAdmin(changePasswordAdminDto: ChangePassworAdmindDto): Promise<{
        message: string;
    }>;
    updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<{
        id: number;
        name: string;
        userName: string;
        phone: string;
        branches: {
            id: number;
            name: string;
        }[];
        role: UserRole;
        status: UserStatus;
        createdAt: Date | null;
        updatedAt: Date | null;
    }>;
    private generateTokens;
    private buildUserProfile;
}
