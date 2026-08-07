export class CreateStandaloneSupplierDto {
  name!: string;
  legalName?: string;
  tradingName?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  address?: string;
  depotName?: string;
  paymentTermsDays?: number;
  bankAccountMask?: string;
  category?: string;
}
