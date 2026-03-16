import { IsEnum, IsInt, IsOptional, MaxLength, Min } from 'class-validator';
import { ClassStatus } from '@/database/entities/class.entity';

export class UpdateClassDto {
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  branchId?: number;

  @IsOptional()
  @IsEnum(ClassStatus)
  status?: ClassStatus;
}
