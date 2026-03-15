import { IsOptional } from 'class-validator';

export class BaseQueryDto {
  @IsOptional()
  page?: string;
  @IsOptional()
  limit?: string;
  @IsOptional()
  search?: string;
}
