import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, round2, toNumber } from '../common/decimal';
import { ProductCategory, SalesChannel, StockOwnership } from '../common/enums';
import { Product } from '../products/product.entity';
import { AccessoryStock } from './accessory-stock.entity';
import { ChannelPrice } from './channel-price.entity';
import { ProductBundle } from './product-bundle.entity';

@Injectable()
export class AccessoriesService {
  constructor(
    @InjectRepository(AccessoryStock)
    private readonly stockRepo: Repository<AccessoryStock>,
    @InjectRepository(ChannelPrice)
    private readonly pricesRepo: Repository<ChannelPrice>,
    @InjectRepository(ProductBundle)
    private readonly bundlesRepo: Repository<ProductBundle>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  listStock(stationId?: string) {
    return this.stockRepo.find({
      where: stationId ? { stationId } : {},
      relations: { product: true, station: true },
      order: { updatedAt: 'DESC' },
    });
  }

  listLowStock() {
    return this.stockRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.product', 'product')
      .leftJoinAndSelect('s.station', 'station')
      .where('s.quantity <= s.reorder_level')
      .getMany();
  }

  listChannelPrices(productId?: string) {
    return this.pricesRepo.find({
      where: productId ? { productId, isActive: true } : { isActive: true },
      relations: { product: true },
    });
  }

  async getPrice(productId: string, channel: SalesChannel) {
    const price = await this.pricesRepo.findOne({
      where: { productId, channel, isActive: true },
    });
    if (price) return toNumber(price.unitPrice);
    const product = await this.productsRepo.findOne({
      where: { id: productId },
    });
    return toNumber(product?.unitPrice ?? 0);
  }

  listBundles() {
    return this.bundlesRepo.find({
      where: { isActive: true },
      relations: { items: { product: true }, product: true },
    });
  }

  async findByBarcode(barcode: string) {
    const product = await this.productsRepo.findOne({
      where: { barcode, isActive: true },
    });
    if (product) return { type: 'product' as const, product };
    const bundle = await this.bundlesRepo.findOne({
      where: { sku: barcode, isActive: true },
      relations: { items: { product: true } },
    });
    if (bundle) return { type: 'bundle' as const, bundle };
    throw new NotFoundException(`No product or bundle for barcode ${barcode}`);
  }

  async adjustStock(params: {
    stationId: string;
    productId: string;
    delta: number;
    ownership?: StockOwnership;
  }) {
    const ownership = params.ownership ?? StockOwnership.OWNED;
    let row = await this.stockRepo.findOne({
      where: {
        stationId: params.stationId,
        productId: params.productId,
        ownership,
      },
    });
    if (!row) {
      row = this.stockRepo.create({
        stationId: params.stationId,
        productId: params.productId,
        ownership,
        quantity: 0,
      });
    }
    row.quantity += params.delta;
    if (row.quantity < 0) {
      throw new BadRequestException('Insufficient accessory stock');
    }
    return this.stockRepo.save(row);
  }

  async deductForSale(
    stationId: string,
    items: Array<{ productId: string; quantity: number }>,
  ) {
    let cogs = 0;
    for (const item of items) {
      await this.adjustStock({
        stationId,
        productId: item.productId,
        delta: -item.quantity,
      });
      const product = await this.productsRepo.findOne({
        where: { id: item.productId },
      });
      cogs += toNumber(product?.costPrice ?? 0) * item.quantity;
    }
    return round2(cogs);
  }

  async explodeBundle(bundleId: string) {
    const bundle = await this.bundlesRepo.findOne({
      where: { id: bundleId },
      relations: { items: { product: true } },
    });
    if (!bundle) throw new NotFoundException('Bundle not found');
    return bundle.items.map((i) => ({
      productId: i.productId,
      productName: i.product.name,
      quantity: i.quantity,
      unitPrice: toNumber(i.product.unitPrice),
      costPrice: toNumber(i.product.costPrice),
    }));
  }

  listAccessories() {
    return this.productsRepo.find({
      where: [
        { category: ProductCategory.ACCESSORY, isActive: true },
        { category: ProductCategory.BUNDLE, isActive: true },
      ],
      order: { name: 'ASC' },
    });
  }

  async receiveStock(params: {
    stationId: string;
    productId: string;
    quantity: number;
    ownership?: StockOwnership;
    batchNumber?: string;
  }) {
    const row = await this.adjustStock({
      stationId: params.stationId,
      productId: params.productId,
      delta: params.quantity,
      ownership: params.ownership,
    });
    if (params.batchNumber) {
      row.batchNumber = params.batchNumber;
      await this.stockRepo.save(row);
    }
    return row;
  }

  async seedStockLine(
    stationId: string,
    productId: string,
    quantity: number,
    ownership = StockOwnership.OWNED,
  ) {
    const existing = await this.stockRepo.findOne({
      where: { stationId, productId, ownership },
    });
    if (existing) return existing;
    return this.stockRepo.save(
      this.stockRepo.create({
        stationId,
        productId,
        quantity,
        ownership,
      }),
    );
  }

  async seedChannelPrice(
    productId: string,
    channel: SalesChannel,
    unitPrice: number,
    commissionPercent = 0,
  ) {
    const existing = await this.pricesRepo.findOne({
      where: { productId, channel },
    });
    if (existing) return existing;
    return this.pricesRepo.save(
      this.pricesRepo.create({
        productId,
        channel,
        unitPrice: asDecimal(unitPrice, 2),
        commissionPercent: asDecimal(commissionPercent, 2),
      }),
    );
  }
}
