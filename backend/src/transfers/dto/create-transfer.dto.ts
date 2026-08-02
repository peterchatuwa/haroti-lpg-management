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
import { TransferItemType } from '../../common/enums';

export class TransferItemDto {
  @IsEnum(TransferItemType)
  itemType!: TransferItemType;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0.001)
  quantityDispatched!: number;

  @IsOptional()
  @IsString()
  cylinderSerial?: string;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class CreateTransferDto {
  @IsUUID()
  sourceStationId!: string;

  @IsUUID()
  destinationStationId!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items!: TransferItemDto[];
}

export class ReceiveTransferDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items!: ReceiveItemDto[];
}

export class ReceiveItemDto {
  @IsUUID()
  itemId!: string;

  @IsNumber()
  @Min(0)
  quantityReceived!: number;
}
