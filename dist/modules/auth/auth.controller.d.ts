import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserRole } from '@/database/entities/user.entity';
import { AuthenticatedUser } from '@/common/interfaces/authenticated-user.interface';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePassworAdmindDto } from './dto/change-password-admin.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
            status: import("@/database/entities/user.entity").UserStatus;
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
            status: import("@/database/entities/user.entity").UserStatus;
            createdAt: Date | null;
            updatedAt: Date | null;
        };
    }>;
    refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
    }>;
    logout(refreshTokenDto: RefreshTokenDto): {
        message: string;
    };
    profile(user: AuthenticatedUser): Promise<{
        id: number;
        name: string;
        userName: string;
        phone: string;
        branches: {
            id: number;
            name: string;
        }[];
        role: UserRole;
        status: import("@/database/entities/user.entity").UserStatus;
        createdAt: Date | null;
        updatedAt: Date | null;
    }>;
    changePassword(user: AuthenticatedUser, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    changePasswordAdmin(changePasswordAdminDto: ChangePassworAdmindDto): Promise<{
        message: string;
    }>;
    updateProfile(user: AuthenticatedUser, updateProfileDto: UpdateProfileDto): Promise<{
        id: number;
        name: string;
        userName: string;
        phone: string;
        branches: {
            id: number;
            name: string;
        }[];
        role: UserRole;
        status: import("@/database/entities/user.entity").UserStatus;
        createdAt: Date | null;
        updatedAt: Date | null;
    }>;
}
