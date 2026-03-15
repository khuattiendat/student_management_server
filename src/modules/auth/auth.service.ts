import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole, UserStatus } from '@/database/entities/user.entity';
import { Branch } from '@/database/entities/branch.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { StringValue } from 'ms';

interface JwtPayload {
  sub: number;
  userName: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { userName: registerDto.userName },
      relations: ['branches'],
    });

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const password = await bcrypt.hash(registerDto.password, 10);
    const branchIds = [...new Set(registerDto.branchIds ?? [])];
    let branches: Branch[] = [];

    if (branchIds.length > 0) {
      branches = await this.branchRepository.find({
        where: { id: In(branchIds) },
      });

      if (branches.length !== branchIds.length) {
        const foundIds = new Set(branches.map((branch) => branch.id));
        const missingBranchIds = branchIds.filter((id) => !foundIds.has(id));
        throw new BadRequestException(
          `Invalid branchIds: ${missingBranchIds.join(', ')}`,
        );
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
      throw new UnauthorizedException('User not found after register');
    }

    return {
      user: this.buildUserProfile(savedUserWithBranches),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.user_name = :userName', { userName: loginDto.userName })
      .leftJoinAndSelect('user.branches', 'branches')
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('User is inactive');
    }

    const tokens = await this.generateTokens(user);

    return {
      user: this.buildUserProfile(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'refresh-secret-key',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
    };
  }

  logout(refreshToken: string) {
    return {
      message: 'Logged out successfully',
    };
  }

  async profile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['branches'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.buildUserProfile(user);
  }

  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      userName: user.userName,
      role: user.role,
    };

    const accessExpiresIn = (this.configService.get<string>(
      'JWT_ACCESS_EXPIRES',
    ) || '15m') as StringValue;

    const refreshExpiresIn = (this.configService.get<string>(
      'JWT_REFRESH_EXPIRES',
    ) || '7d') as StringValue;

    const accessToken = await this.jwtService.signAsync(payload, {
      secret:
        this.configService.get<string>('JWT_ACCESS_SECRET') ||
        'access-secret-key',
      expiresIn: accessExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret:
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'refresh-secret-key',
      expiresIn: refreshExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    };
  }

  private buildUserProfile(user: User) {
    const branches =
      user.branches?.map((branch) => ({
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
}
