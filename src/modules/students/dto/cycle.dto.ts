import { IsArray, IsOptional, IsNumberString } from 'class-validator';

export class CycleDto {
  @IsOptional()
  @IsNumberString()
  classId: string;

  @IsOptional()
  @IsArray()
  studentIds: string[];
}
