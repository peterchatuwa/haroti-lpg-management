import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { Station } from '../stations/station.entity';
import { StationStatus } from '../common/enums';
import {
  SubmitOrderDto,
  WebFulfillmentType,
} from './dto/submit-order.dto';
import { PublicCatalogService } from './public-catalog.service';

@Injectable()
export class PublicOrdersService {
  constructor(
    private readonly catalogService: PublicCatalogService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
    @InjectRepository(Station)
    private readonly stationsRepo: Repository<Station>,
  ) {}

  async listStations() {
    const stations = await this.stationsRepo.find({
      where: { status: StationStatus.ACTIVE },
      order: { district: 'ASC', name: 'ASC' },
    });
    return stations.map((s) => ({
      code: s.code,
      name: s.name,
      district: s.district,
      address: s.address ?? null,
    }));
  }

  async submitOrder(dto: SubmitOrderDto) {
    if (dto.website?.trim()) {
      throw new BadRequestException('Invalid submission');
    }

    this.validateFulfillment(dto);

    const catalog = await this.catalogService.getCatalog();
    const bySku = new Map(catalog.map((item) => [item.sku, item]));

    const resolvedLines: {
      sku: string;
      name: string;
      category: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[] = [];

    for (const line of dto.lines) {
      const product = bySku.get(line.sku);
      if (!product) {
        throw new BadRequestException(`Unknown product: ${line.sku}`);
      }
      if (!product.inStock || product.quantityAvailable < line.quantity) {
        throw new BadRequestException(
          `${product.name} is not available in the requested quantity`,
        );
      }
      const lineTotal = product.unitPrice * line.quantity;
      resolvedLines.push({
        sku: product.sku,
        name: product.name,
        category: product.category,
        quantity: line.quantity,
        unitPrice: product.unitPrice,
        lineTotal,
      });
    }

    if (dto.preferredStationCode) {
      const station = await this.stationsRepo.findOne({
        where: { code: dto.preferredStationCode, status: StationStatus.ACTIVE },
      });
      if (!station) {
        throw new BadRequestException('Selected station is not available');
      }
    }

    const orderTotal = resolvedLines.reduce((sum, l) => sum + l.lineTotal, 0);
    const orderReference = this.buildOrderReference();
    const stationLabel = dto.preferredStationCode ?? 'Not specified';

    const body = [
      `New website order — ${orderReference}`,
      '',
      '=== CUSTOMER ===',
      `Name: ${dto.firstName} ${dto.lastName}`,
      `Phone: ${dto.phone}`,
      `Email: ${dto.email}`,
      `National ID: ${dto.nationalId?.trim() || 'Not provided'}`,
      '',
      '=== FULFILLMENT ===',
      `Type: ${this.fulfillmentLabel(dto.fulfillmentType)}`,
      `Preferred station: ${stationLabel}`,
      ...(dto.fulfillmentType !== WebFulfillmentType.PICKUP
        ? [
            `Delivery address: ${dto.deliveryAddress}`,
            `Area / landmark: ${dto.deliveryArea?.trim() || 'Not provided'}`,
            `District: ${dto.deliveryDistrict}`,
          ]
        : []),
      ...(dto.fulfillmentType === WebFulfillmentType.INSTALLATION
        ? [`Installation details: ${dto.installationNotes}`]
        : []),
      '',
      '=== ORDER LINES ===',
      ...resolvedLines.map(
        (l) =>
          `${l.sku} | ${l.name} (${l.category}) | Qty ${l.quantity} × MWK ${l.unitPrice.toLocaleString('en-MW')} = MWK ${l.lineTotal.toLocaleString('en-MW')}`,
      ),
      '',
      `ORDER TOTAL (estimate): MWK ${orderTotal.toLocaleString('en-MW')}`,
      '',
      '=== CUSTOMER NOTES ===',
      dto.customerNotes?.trim() || 'None',
      '',
      '---',
      'No online payment was taken. Contact the customer to confirm availability, payment method, and delivery/installation schedule.',
    ].join('\n');

    const subject = `[Web Order ${orderReference}] ${dto.firstName} ${dto.lastName} — MWK ${orderTotal.toLocaleString('en-MW')}`;

    const result = await this.notifications.sendDirectEmail(
      this.operationsEmail(),
      subject,
      body,
      dto.email,
    );

    if (!result.ok) {
      throw new ServiceUnavailableException(
        result.error ?? 'Unable to submit order',
      );
    }

    return { ok: true, orderReference, orderTotal };
  }

  private operationsEmail() {
    return this.config.get<string>(
      'WEBSITE_OPERATIONS_EMAIL',
      'operations@harotiholdingslimited.com',
    );
  }

  private validateFulfillment(dto: SubmitOrderDto) {
    if (dto.fulfillmentType === WebFulfillmentType.PICKUP) {
      if (!dto.preferredStationCode?.trim()) {
        throw new BadRequestException(
          'Please select a station for pickup',
        );
      }
      return;
    }

    if (!dto.deliveryAddress?.trim() || !dto.deliveryDistrict?.trim()) {
      throw new BadRequestException(
        'Delivery address and district are required',
      );
    }

    if (
      dto.fulfillmentType === WebFulfillmentType.INSTALLATION &&
      !dto.installationNotes?.trim()
    ) {
      throw new BadRequestException(
        'Please describe what needs to be installed',
      );
    }
  }

  private fulfillmentLabel(type: WebFulfillmentType) {
    switch (type) {
      case WebFulfillmentType.PICKUP:
        return 'Pickup at station';
      case WebFulfillmentType.DELIVERY:
        return 'Delivery';
      case WebFulfillmentType.INSTALLATION:
        return 'Delivery + installation';
      default:
        return type;
    }
  }

  private buildOrderReference() {
    const date = new Date();
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `WEB-${y}${m}${d}-${suffix}`;
  }
}
