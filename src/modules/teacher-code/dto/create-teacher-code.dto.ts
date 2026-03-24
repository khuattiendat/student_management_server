import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateTeacherCodeDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  code: string;

  @IsInt()
  @Min(1)
  teacherId: number;
}
