import { IsOptional } from 'class-validator';

export class UpdateBranchDto {
  @IsOptional()
  name?: string;
  @IsOptional()
  address?: string;
  @IsOptional()
  phone?: string;
}
