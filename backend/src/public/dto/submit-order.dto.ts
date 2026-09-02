import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export enum WebFulfillmentType {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
  INSTALLATION = 'installation',
}

export class OrderLineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  sku!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;
}

export class SubmitOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  nationalId?: string;

  @IsEnum(WebFulfillmentType)
  fulfillmentType!: WebFulfillmentType;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  preferredStationCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  deliveryArea?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  deliveryDistrict?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  installationNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customerNotes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  lines!: OrderLineDto[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
