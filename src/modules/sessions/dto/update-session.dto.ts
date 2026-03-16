import {
  IsDateString,
  IsInt,
  IsMilitaryTime,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateSessionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  classId?: number;

  @IsOptional()
  @IsDateString()
  sessionDate?: string;

  @IsOptional()
  @IsMilitaryTime()
  startTime?: string;

  @IsOptional()
  @IsMilitaryTime()
  endTime?: string;
}
