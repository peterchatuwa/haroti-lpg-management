import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, round3, toNumber } from '../common/decimal';
import { DeliveryStatus, StockMovementType } from '../common/enums';
import { InventoryService } from '../inventory/inventory.service';
import { StationsService } from '../stations/stations.service';
import { Delivery } from './delivery.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveriesRepo: Repository<Delivery>,
    private readonly inventoryService: InventoryService,
    private readonly stationsService: StationsService,
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
      status: DeliveryStatus.INVENTORY_UPDATED,
      createdById: userId,
      approvedById: userId,
    });

    const saved = await this.deliveriesRepo.save(delivery);

    if (toNumber(saved.quantityReceivedKg) > 0) {
      await this.inventoryService.applyMovement({
        stationId: dto.stationId,
        type: StockMovementType.SUPPLIER_DELIVERY,
        quantityKg: toNumber(saved.quantityReceivedKg),
        reason: `Delivery ${saved.deliveryNumber}`,
        referenceType: 'Delivery',
        referenceId: saved.id,
        userId,
      });
    }

    return this.deliveriesRepo.findOne({
      where: { id: saved.id },
      relations: { supplier: true, station: true },
    });
  }
}
