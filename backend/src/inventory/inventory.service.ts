import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { asDecimal, round3, toNumber } from '../common/decimal';
import { StockMovementType } from '../common/enums';
import { Station } from '../stations/station.entity';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { StockMovement } from './stock-movement.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movementsRepo: Repository<StockMovement>,
    @InjectRepository(Station)
    private readonly stationsRepo: Repository<Station>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async listMovements(stationId?: string) {
    return this.movementsRepo.find({
      where: stationId ? { stationId } : {},
      order: { createdAt: 'DESC' },
      take: 200,
      relations: { station: true, createdBy: true },
    });
  }

  async applyMovement(params: {
    stationId: string;
    type: StockMovementType;
    quantityKg: number;
    reason?: string;
    referenceType?: string;
    referenceId?: string;
    userId?: string;
    clientTxnId?: string;
    requiresApproval?: boolean;
  }) {
    if (params.clientTxnId) {
      const existing = await this.movementsRepo.findOne({
        where: { clientTxnId: params.clientTxnId },
      });
      if (existing) {
        return existing;
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const station = await manager.findOne(Station, {
        where: { id: params.stationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!station) {
        throw new NotFoundException('Station not found');
      }

      const before = toNumber(station.currentStockKg);
      const after = round3(before + params.quantityKg);
      if (after < -0.001) {
        throw new BadRequestException('Insufficient LPG stock at station');
      }

      station.currentStockKg = asDecimal(Math.max(after, 0));
      await manager.save(station);

      const movement = manager.create(StockMovement, {
        stationId: station.id,
        type: params.type,
        quantityKg: asDecimal(params.quantityKg),
        stockBeforeKg: asDecimal(before),
        stockAfterKg: station.currentStockKg,
        reason: params.reason,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        createdById: params.userId,
        clientTxnId: params.clientTxnId,
        requiresApproval: params.requiresApproval ?? false,
      });
      return manager.save(movement);
    });
  }

  async adjustStock(dto: AdjustStockDto, userId: string) {
    if (dto.quantityKg === 0) {
      throw new BadRequestException('Adjustment quantity cannot be zero');
    }

    const requiresApproval = Math.abs(dto.quantityKg) >= 20;
    const movement = await this.applyMovement({
      stationId: dto.stationId,
      type: StockMovementType.STOCK_ADJUSTMENT,
      quantityKg: dto.quantityKg,
      reason: dto.reason,
      userId,
      clientTxnId: dto.clientTxnId,
      requiresApproval,
    });

    await this.auditService.log({
      userId,
      action: 'STOCK_ADJUSTMENT',
      entityType: 'StockMovement',
      entityId: movement.id,
      newValues: {
        stationId: dto.stationId,
        quantityKg: dto.quantityKg,
        reason: dto.reason,
      },
      reason: dto.reason,
      stationId: dto.stationId,
    });

    return movement;
  }

  async stockPosition(stationId: string) {
    const station = await this.stationsRepo.findOne({ where: { id: stationId } });
    if (!station) {
      throw new NotFoundException('Station not found');
    }

    const movements = await this.movementsRepo.find({
      where: { stationId },
      order: { createdAt: 'ASC' },
    });

    let received = 0;
    let transfersIn = 0;
    let sold = 0;
    let transfersOut = 0;
    let losses = 0;

    for (const m of movements) {
      const qty = toNumber(m.quantityKg);
      switch (m.type) {
        case StockMovementType.SUPPLIER_DELIVERY:
        case StockMovementType.OPENING_STOCK:
          received += qty;
          break;
        case StockMovementType.TRANSFER_IN:
          transfersIn += qty;
          break;
        case StockMovementType.REFILL_SALE:
          sold += Math.abs(qty);
          break;
        case StockMovementType.TRANSFER_OUT:
          transfersOut += Math.abs(qty);
          break;
        case StockMovementType.LEAKAGE_LOSS:
        case StockMovementType.INTERNAL_CONSUMPTION:
        case StockMovementType.TESTING_CALIBRATION:
          losses += Math.abs(qty);
          break;
        default:
          break;
      }
    }

    const expectedClosing = round3(
      received + transfersIn - sold - transfersOut - losses,
    );
    const physical = toNumber(station.currentStockKg);
    return {
      stationId,
      stationCode: station.code,
      physicalClosingStockKg: physical,
      expectedClosingStockKg: expectedClosing,
      stockVarianceKg: round3(physical - expectedClosing),
      components: {
        receivedKg: round3(received),
        transfersInKg: round3(transfersIn),
        soldKg: round3(sold),
        transfersOutKg: round3(transfersOut),
        lossesKg: round3(losses),
      },
    };
  }
}
