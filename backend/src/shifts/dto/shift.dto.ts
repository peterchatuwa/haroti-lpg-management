import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class OpenShiftDto {
  @IsUUID()
  stationId!: string;

  @IsNumber()
  @Min(0)
  openingCashFloat!: number;

  @IsOptional()
  @IsNumber()
  openingCylinderCount?: number;
}

export class CloseShiftDto {
  @IsNumber()
  @Min(0)
  cashCounted!: number;

  @IsNumber()
  @Min(0)
  physicalLpgStockKg!: number;

  @IsOptional()
  @IsNumber()
  cashDeposited?: number;

  @IsOptional()
  @IsNumber()
  closingCylinderCount?: number;

  @IsOptional()
  @IsString()
  varianceNotes?: string;
}
