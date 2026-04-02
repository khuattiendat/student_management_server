import { IsNotEmpty } from 'class-validator';

export class UpdateIsPaidEnrollmentDto {
  @IsNotEmpty()
  isPaid: boolean;
}
