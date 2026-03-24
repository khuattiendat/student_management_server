import { IsDateString, IsOptional } from 'class-validator';

export class QueryCalendarSessionDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  branchId?: string;

  @IsOptional()
  classId?: string;
}
