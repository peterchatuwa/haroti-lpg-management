import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, round3, toNumber } from '../common/decimal';
import { DeliveryStatus, StockMovementType } from '../common/enums';
import { InventoryService } from '../inventory/inventory.service';
import { JournalEventType } from '../common/enums';
import { FinanceService, GL_ACCOUNTS } from '../finance/finance.service';
import { StationsService } from '../stations/stations.service';
import { Delivery } from './delivery.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';

const WORKFLOW: DeliveryStatus[] = [
  DeliveryStatus.PURCHASE_ORDER,
  DeliveryStatus.SUPPLIER_DISPATCH,
  DeliveryStatus.STATION_RECEIPT,
  DeliveryStatus.QUANTITY_VERIFICATION,
  DeliveryStatus.MANAGER_APPROVAL,
  DeliveryStatus.INVENTORY_UPDATED,
  DeliveryStatus.ACCOUNTS_PAYABLE,
];

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveriesRepo: Repository<Delivery>,
    private readonly inventoryService: InventoryService,
    private readonly stationsService: StationsService,
    private readonly financeService: FinanceService,
  ) {}

  findAll(stationId?: string) {
    return this.deliveriesRepo.find({
      where: stationId ? { stationId } : {},
      order: { createdAt: 'DESC' },
      relations: { supplier: true, station: true },
      take: 100,
    });
  }

  async create(dto: CreateDeliveryDto, userId: string) {
    const station = await this.stationsService.findOne(dto.stationId);
    const stamp = Date.now().toString().slice(-8);
    const delivery = this.deliveriesRepo.create({
      deliveryNumber: `DLV-${station.code}-${stamp}`,
      supplierId: dto.supplierId,
      stationId: dto.stationId,
      deliveryDate: dto.deliveryDate,
      deliveryNoteNumber: dto.deliveryNoteNumber,
      invoiceNumber: dto.invoiceNumber,
      truckRegistration: dto.truckRegistration,
      driverName: dto.driverName,
      sourceDepot: dto.sourceDepot,
      quantityOrderedKg: asDecimal(dto.quantityOrderedKg),
      quantityDispatchedKg: asDecimal(dto.quantityDispatchedKg),
      quantityReceivedKg: asDecimal(dto.quantityReceivedKg),
      tankLevelBeforeKg:
        dto.tankLevelBeforeKg !== undefined
          ? asDecimal(dto.tankLevelBeforeKg)
          : undefined,
      tankLevelAfterKg:
        dto.tankLevelAfterKg !== undefined
          ? asDecimal(dto.tankLevelAfterKg)
          : undefined,
      buyingPricePerKg: asDecimal(dto.buyingPricePerKg, 2),
      transportCost: asDecimal(dto.transportCost ?? 0, 2),
      discrepancyNotes:
        dto.discrepancyNotes ||
        (Math.abs(dto.quantityDispatchedKg - dto.quantityReceivedKg) > 0.01
          ? `Discrepancy ${round3(dto.quantityDispatchedKg - dto.quantityReceivedKg)} kg`
          : undefined),
      status: DeliveryStatus.PURCHASE_ORDER,
      createdById: userId,
    });

    return this.deliveriesRepo.save(delivery);
  }

  async advanceStatus(id: string, userId: string) {
    const delivery = await this.deliveriesRepo.findOne({ where: { id } });
    if (!delivery) throw new NotFoundException('Delivery not found');

    const idx = WORKFLOW.indexOf(delivery.status);
    if (idx < 0 || idx >= WORKFLOW.length - 1) {
      throw new BadRequestException('Delivery cannot advance further');
    }

    const next = WORKFLOW[idx + 1];
    delivery.status = next;

    if (next === DeliveryStatus.INVENTORY_UPDATED) {
      if (toNumber(delivery.quantityReceivedKg) > 0) {
        await this.inventoryService.applyMovement({
          stationId: delivery.stationId,
          type: StockMovementType.SUPPLIER_DELIVERY,
          quantityKg: toNumber(delivery.quantityReceivedKg),
          reason: `Delivery ${delivery.deliveryNumber}`,
          referenceType: 'Delivery',
          referenceId: delivery.id,
          userId,
        });
        const landedCost = round3(
          toNumber(delivery.quantityReceivedKg) *
            toNumber(delivery.buyingPricePerKg) +
            toNumber(delivery.transportCost),
        );
        await this.financeService.postEntry({
          eventType: JournalEventType.LPG_DELIVERY,
          description: `LPG delivery ${delivery.deliveryNumber}`,
          referenceType: 'Delivery',
          referenceId: delivery.id,
          lines: [
            { account: GL_ACCOUNTS.INVENTORY_BULK_LPG, debit: landedCost },
            { account: GL_ACCOUNTS.ACCOUNTS_PAYABLE, credit: landedCost },
          ],
        });
      }
      delivery.approvedById = userId;
    }

    return this.deliveriesRepo.save(delivery);
  }

  async approve(id: string, userId: string) {
    const delivery = await this.deliveriesRepo.findOne({ where: { id } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (delivery.status !== DeliveryStatus.MANAGER_APPROVAL) {
      throw new BadRequestException('Delivery is not awaiting manager approval');
    }
    return this.advanceStatus(id, userId);
  }
}
