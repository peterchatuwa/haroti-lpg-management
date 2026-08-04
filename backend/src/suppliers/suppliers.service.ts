import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../customers/customer.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { Supplier } from './supplier.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly suppliersRepo: Repository<Supplier>,
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
  ) {}

  findAll() {
    return this.suppliersRepo.find({
      where: { isActive: true },
      relations: { customer: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const supplier = await this.suppliersRepo.findOne({
      where: { id },
      relations: { customer: true },
    });
    if (!supplier) throw new NotFoundException('Vendor not found');
    return supplier;
  }

  async createFromCustomer(dto: CreateSupplierDto) {
    const customer = await this.customersRepo.findOne({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new BadRequestException('Customer not found — vendors must be existing customers');
    }

    const existing = await this.suppliersRepo.findOne({
      where: { customerId: dto.customerId },
    });
    if (existing) {
      throw new BadRequestException('This customer is already registered as a vendor');
    }

    const code = `VND-${customer.customerCode.replace(/^CUS-/, '')}`;
    const duplicateCode = await this.suppliersRepo.findOne({ where: { code } });
    const finalCode = duplicateCode
      ? `VND-${Date.now().toString().slice(-6)}`
      : code;

    return this.suppliersRepo.save(
      this.suppliersRepo.create({
        code: finalCode,
        name: customer.fullName,
        phone: customer.phone,
        email: dto.email,
        depotName: dto.depotName ?? customer.location,
        address: dto.address ?? customer.location,
        customerId: customer.id,
        isActive: true,
      }),
    );
  }

  /** Returns customers not yet linked as vendors. */
  async eligibleCustomers() {
    const vendors = await this.suppliersRepo.find({
      where: { isActive: true },
      select: { customerId: true },
    });
    const linkedIds = vendors
      .map((v) => v.customerId)
      .filter((id): id is string => !!id);

    const qb = this.customersRepo
      .createQueryBuilder('c')
      .orderBy('c.full_name', 'ASC')
      .take(500);

    if (linkedIds.length) {
      qb.where('c.id NOT IN (:...linkedIds)', { linkedIds });
    }

    return qb.getMany();
  }
}
