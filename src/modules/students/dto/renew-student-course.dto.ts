import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RenewStudentCourseDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  packageIds: number[];
}
