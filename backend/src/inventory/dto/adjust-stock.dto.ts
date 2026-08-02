import { IsNumber, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class AdjustStockDto {
  @IsUUID()
  stationId!: string;

  @IsNumber()
  quantityKg!: number;

  @IsString()
  @MinLength(5)
  reason!: string;

  @IsOptional()
  @IsString()
  clientTxnId?: string;
}
