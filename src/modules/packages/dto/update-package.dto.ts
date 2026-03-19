import { IsEnum, IsInt, IsOptional, MaxLength, Min } from 'class-validator';
import { PackageType } from '@/database/entities/package.entity';

export class UpdatePackageDto {
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalSessions?: number;

  @IsOptional()
  price?: string;

  @IsOptional()
  @IsEnum(PackageType)
  type?: PackageType;
}
