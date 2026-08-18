import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal } from '../common/decimal';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  findAll(includeInactive = false) {
    return this.productsRepo.find({
      where: includeInactive ? {} : { isActive: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    const sku = dto.sku.trim().toUpperCase();
    const existing = await this.productsRepo.findOne({ where: { sku } });
    if (existing) {
      throw new ConflictException(`SKU ${sku} already exists`);
    }

    const product = this.productsRepo.create({
      sku,
      name: dto.name.trim(),
      category: dto.category,
      unitPrice: asDecimal(dto.unitPrice, 2),
      pricePerKg:
        dto.pricePerKg != null ? asDecimal(dto.pricePerKg, 2) : undefined,
      nominalKg:
        dto.nominalKg != null ? asDecimal(dto.nominalKg, 3) : undefined,
      costPrice: asDecimal(dto.costPrice ?? 0, 2),
      barcode: dto.barcode?.trim() || undefined,
      description: dto.description?.trim() || undefined,
      serialTracked: dto.serialTracked ?? false,
      batchTracked: dto.batchTracked ?? false,
      isActive: dto.isActive ?? true,
    });

    return this.productsRepo.save(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findOne(id);

    if (dto.sku && dto.sku.trim().toUpperCase() !== product.sku) {
      const sku = dto.sku.trim().toUpperCase();
      const clash = await this.productsRepo.findOne({ where: { sku } });
      if (clash && clash.id !== id) {
        throw new ConflictException(`SKU ${sku} already exists`);
      }
      product.sku = sku;
    }

    if (dto.name !== undefined) product.name = dto.name.trim();
    if (dto.category !== undefined) product.category = dto.category;
    if (dto.unitPrice !== undefined) {
      product.unitPrice = asDecimal(dto.unitPrice, 2);
    }
    if (dto.pricePerKg !== undefined) {
      product.pricePerKg = asDecimal(dto.pricePerKg, 2);
    }
    if (dto.nominalKg !== undefined) {
      product.nominalKg = asDecimal(dto.nominalKg, 3);
    }
    if (dto.costPrice !== undefined) {
      product.costPrice = asDecimal(dto.costPrice, 2);
    }
    if (dto.barcode !== undefined) {
      product.barcode = dto.barcode.trim() || undefined;
    }
    if (dto.description !== undefined) {
      product.description = dto.description.trim() || undefined;
    }
    if (dto.serialTracked !== undefined) {
      product.serialTracked = dto.serialTracked;
    }
    if (dto.batchTracked !== undefined) {
      product.batchTracked = dto.batchTracked;
    }
    if (dto.isActive !== undefined) product.isActive = dto.isActive;

    return this.productsRepo.save(product);
  }
}
