import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSupplierDto {
  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsString()
  depotName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
