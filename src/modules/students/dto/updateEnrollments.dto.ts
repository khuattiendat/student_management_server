import { IsNotEmpty } from 'class-validator';

export class UpdateEnrollmentsDto {
  @IsNotEmpty()
  oldPackageId!: Number;
  @IsNotEmpty()
  newPackageId!: Number;
  @IsNotEmpty()
  isPaid!: boolean;
}
