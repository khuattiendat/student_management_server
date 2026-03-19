import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';
import { PackageType } from '@/database/entities/package.entity';

export class CreatePackageDto {
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
  @IsOptional()
  @IsInt()
  @Min(1)
  totalSessions: number;

  @IsNotEmpty()
  price: string;

  @IsEnum(PackageType)
  type: PackageType;
}
