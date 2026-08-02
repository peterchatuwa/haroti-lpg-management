import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateDeliveryDto {
  @IsUUID()
  supplierId!: string;

  @IsUUID()
  stationId!: string;

  @IsString()
  deliveryDate!: string;

  @IsOptional()
  @IsString()
  deliveryNoteNumber?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  truckRegistration?: string;

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsString()
  sourceDepot?: string;

  @IsNumber()
  @Min(0)
  quantityOrderedKg!: number;

  @IsNumber()
  @Min(0)
  quantityDispatchedKg!: number;

  @IsNumber()
  @Min(0)
  quantityReceivedKg!: number;

  @IsOptional()
  @IsNumber()
  tankLevelBeforeKg?: number;

  @IsOptional()
  @IsNumber()
  tankLevelAfterKg?: number;

  @IsNumber()
  @Min(0)
  buyingPricePerKg!: number;

  @IsOptional()
  @IsNumber()
  transportCost?: number;

  @IsOptional()
  @IsString()
  discrepancyNotes?: string;
}
