import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ProductCategory } from '../../common/enums';

export class CreateProductDto {
  @IsString()
  @MaxLength(40)
  sku!: string;

  @IsString()
  @MaxLength(160)
  name!: string;

  @IsEnum(ProductCategory)
  category!: ProductCategory;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  nominalKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  barcode?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  serialTracked?: boolean;

  @IsOptional()
  @IsBoolean()
  batchTracked?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
