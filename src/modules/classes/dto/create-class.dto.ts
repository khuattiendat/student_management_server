import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';
import { ClassStatus } from '@/database/entities/class.entity';

export class CreateClassDto {
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  branchId?: number;

  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;
}
