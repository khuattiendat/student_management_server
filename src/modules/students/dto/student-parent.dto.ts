import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class StudentParentDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @ValidateIf((object: StudentParentDto) => object.id === undefined)
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;
}
