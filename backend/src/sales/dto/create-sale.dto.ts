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
import { PaymentMethod, SalesChannel } from '../../common/enums';

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

  @IsUUID()
  shiftId!: string;

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

  @IsOptional()
  @IsUUID()
  bundleId?: string;

  @IsOptional()
  @IsEnum(SalesChannel)
  salesChannel?: SalesChannel;

  /** Required when payment method is PAYCHANGU — customer mobile money number */
  @IsOptional()
  @IsString()
  customerPhone?: string;

  /** Airtel, Mpamba, or Card when using PayChangu gateway */
  @IsOptional()
  @IsEnum(PaymentMethod)
  paychanguOperator?: PaymentMethod;

  /** PayChangu card charge — required when payment method is CARD */
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @IsOptional()
  @IsString()
  cardExpiry?: string;

  @IsOptional()
  @IsString()
  cardCvv?: string;

  @IsOptional()
  @IsString()
  cardholderName?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  cardCurrency?: string;
}
