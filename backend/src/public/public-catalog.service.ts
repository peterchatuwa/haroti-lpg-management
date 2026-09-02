import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductBundle } from '../accessories/product-bundle.entity';
import { AccessoryStock } from '../accessories/accessory-stock.entity';
import { toNumber } from '../common/decimal';
import {
  CylinderStatus,
  ProductCategory,
  StationStatus,
} from '../common/enums';
import { Cylinder } from '../cylinders/cylinder.entity';
import { Product } from '../products/product.entity';
import { Station } from '../stations/station.entity';

export interface PublicCatalogItem {
  sku: string;
  name: string;
  category: 'cylinder' | 'accessory' | 'bundle';
  unitPrice: number;
  nominalKg: number | null;
  quantityAvailable: number;
  inStock: boolean;
}

@Injectable()
export class PublicCatalogService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(AccessoryStock)
    private readonly stockRepo: Repository<AccessoryStock>,
    @InjectRepository(Station)
    private readonly stationsRepo: Repository<Station>,
    @InjectRepository(Cylinder)
    private readonly cylindersRepo: Repository<Cylinder>,
    @InjectRepository(ProductBundle)
    private readonly bundlesRepo: Repository<ProductBundle>,
  ) {}

  async getCatalog(): Promise<PublicCatalogItem[]> {
    const [products, stations, stockRows, cylinderRows, bundles] =
      await Promise.all([
        this.productsRepo.find({
          where: { isActive: true },
          order: { sku: 'ASC' },
        }),
        this.stationsRepo.find({ where: { status: StationStatus.ACTIVE } }),
        this.stockRepo
          .createQueryBuilder('s')
          .innerJoin('s.station', 'st', 'st.status = :active', {
            active: StationStatus.ACTIVE,
          })
          .select('s.product_id', 'productId')
          .addSelect('SUM(s.quantity)', 'quantity')
          .groupBy('s.product_id')
          .getRawMany<{ productId: string; quantity: string }>(),
        this.cylindersRepo
          .createQueryBuilder('c')
          .innerJoin('c.station', 'st', 'st.status = :active', {
            active: StationStatus.ACTIVE,
          })
          .select('c.size_kg', 'sizeKg')
          .addSelect('COUNT(*)', 'count')
          .where('c.status = :avail', { avail: CylinderStatus.AVAILABLE })
          .groupBy('c.size_kg')
          .getRawMany<{ sizeKg: string; count: string }>(),
        this.bundlesRepo.find({
          where: { isActive: true },
          relations: { items: { product: true } },
          order: { sku: 'ASC' },
        }),
      ]);

    const totalBulkKg = stations.reduce(
      (sum, station) => sum + toNumber(station.currentStockKg),
      0,
    );

    const stockByProduct = new Map(
      stockRows.map((row) => [row.productId, Number(row.quantity) || 0]),
    );

    const cylindersBySize = new Map(
      cylinderRows.map((row) => [
        toNumber(row.sizeKg),
        Number(row.count) || 0,
      ]),
    );

    const items: PublicCatalogItem[] = [];

    for (const product of products) {
      if (
        product.category === ProductCategory.LPG_REFILL &&
        product.sku.startsWith('CYL-')
      ) {
        const nominal = product.nominalKg ? toNumber(product.nominalKg) : 0;
        const fromBulk =
          nominal > 0 ? Math.floor(totalBulkKg / nominal) : 0;
        const fromCylinders = nominal > 0 ? (cylindersBySize.get(nominal) ?? 0) : 0;
        const quantityAvailable = Math.max(fromBulk, fromCylinders);
        items.push({
          sku: product.sku,
          name: product.name,
          category: 'cylinder',
          unitPrice: toNumber(product.unitPrice),
          nominalKg: nominal || null,
          quantityAvailable,
          inStock: quantityAvailable > 0,
        });
        continue;
      }

      if (product.category === ProductCategory.ACCESSORY) {
        const quantityAvailable = stockByProduct.get(product.id) ?? 0;
        items.push({
          sku: product.sku,
          name: product.name,
          category: 'accessory',
          unitPrice: toNumber(product.unitPrice),
          nominalKg: null,
          quantityAvailable,
          inStock: quantityAvailable > 0,
        });
      }
    }

    for (const bundle of bundles) {
      let quantityAvailable = 0;
      if (bundle.productId) {
        quantityAvailable = stockByProduct.get(bundle.productId) ?? 0;
      } else if (bundle.items?.length) {
        quantityAvailable = Math.min(
          ...bundle.items.map(
            (item) => stockByProduct.get(item.productId) ?? 0,
          ),
        );
        if (!Number.isFinite(quantityAvailable)) {
          quantityAvailable = 0;
        }
      }

      items.push({
        sku: bundle.sku,
        name: bundle.name,
        category: 'bundle',
        unitPrice: toNumber(bundle.bundlePrice),
        nominalKg: null,
        quantityAvailable,
        inStock: quantityAvailable > 0,
      });
    }

    return items;
  }
}
