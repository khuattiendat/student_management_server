import { UserStatus } from '@/database/entities/user.entity';
import { IsEnum, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  name: string;
  @IsNotEmpty()
  userName: string;
  @IsNotEmpty()
  @MinLength(6)
  password: string;
  @IsOptional()
  phone?: string;
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
  @IsOptional()
  branchIds?: number[];
}
