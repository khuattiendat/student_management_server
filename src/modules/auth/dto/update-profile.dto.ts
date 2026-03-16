import { IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  phone?: string;
}
