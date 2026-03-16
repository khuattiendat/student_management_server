import {
  IsDateString,
  IsInt,
  IsMilitaryTime,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class CreateSessionDto {
  @IsInt()
  @Min(1)
  classId: number;

  @IsDateString()
  sessionDate: string;

  @IsNotEmpty()
  @IsMilitaryTime()
  startTime: string;

  @IsNotEmpty()
  @IsMilitaryTime()
  endTime: string;
}
