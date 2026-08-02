import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsUUID()
  stationId!: string;

  @IsString()
  category!: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  expenseDate!: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  receiptReference?: string;

  @IsOptional()
  @IsUUID()
  shiftId?: string;
}
