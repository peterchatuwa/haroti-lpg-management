import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateExpenditureDto {
  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsDateString()
  expenseDate!: string;

  @IsOptional()
  @IsString()
  vendorName?: string;

  @IsOptional()
  @IsBoolean()
  isCwip?: boolean;
}
