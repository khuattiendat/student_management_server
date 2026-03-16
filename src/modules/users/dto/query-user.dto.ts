import { IsEnum, IsOptional } from 'class-validator';
import { BaseQueryDto } from '@/common/base/base.QueryDto';
import { UserRole, UserStatus } from '@/database/entities/user.entity';

export class QueryUserDto extends BaseQueryDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
