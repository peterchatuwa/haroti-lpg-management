import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { CustomerType } from '../../common/enums';

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  customerCode?: string;

  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(CustomerType)
  type?: CustomerType;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  @IsNumber()
  paymentTermsDays?: number;

  @IsOptional()
  @IsNumber()
  contractPricePerKg?: number;

  @IsOptional()
  @IsUUID()
  stationId?: string;
}
