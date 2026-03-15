import { IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateBranchDto {
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
  @IsOptional()
  address?: string;
  @IsOptional()
  phone?: string;
}
