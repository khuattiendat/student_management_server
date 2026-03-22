import { IsNotEmpty, IsOptional } from 'class-validator';

export class QueryStudentsByEnrollmentsDto {
  @IsNotEmpty()
  branchId: string;

  @IsNotEmpty()
  packageIds: string | string[];

  @IsOptional()
  search?: string;
}
