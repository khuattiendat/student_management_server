import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateTeacherCodeDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  code?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  teacherId?: number;
}
