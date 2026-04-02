import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePassworAdmindDto {
  @IsNotEmpty()
  teacherId: number;

  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
