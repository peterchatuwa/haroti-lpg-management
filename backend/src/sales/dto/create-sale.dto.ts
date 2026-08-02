import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '../../common/enums';

export class SaleItemDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsString()
  itemName!: string;

  @IsOptional()
  @IsNumber()
  cylinderSizeKg?: number;

  @IsOptional()
  @IsString()
  cylinderSerial?: string;

  @IsOptional()
  @IsNumber()
  emptyWeightKg?: number;

  @IsOptional()
  @IsNumber()
  filledWeightKg?: number;

  @IsOptional()
  @IsNumber()
  lpgQuantityKg?: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class SalePaymentDto {
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  reference?: string;
}

export class CreateSaleDto {
  @IsUUID()
  stationId!: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalePaymentDto)
  payments!: SalePaymentDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  clientTxnId?: string;
}
