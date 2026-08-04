import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { asDecimal, round3, toNumber } from '../common/decimal';
import {
  LossCaseStatus,
  StockMovementType,
  TankReadingContext,
} from '../common/enums';
import { StockMovement } from '../inventory/stock-movement.entity';
import { Station } from '../stations/station.entity';
import { LossCase } from './loss-case.entity';
import { TankReading } from './tank-reading.entity';
import { Tank } from './tank.entity';

/** Default loss threshold (LPG-007). */
export const DEFAULT_LOSS_THRESHOLD_PERCENT = 2;

@Injectable()
export class TanksService {
  constructor(
    @InjectRepository(Tank) private readonly tanksRepo: Repository<Tank>,
    @InjectRepository(TankReading)
    private readonly readingsRepo: Repository<TankReading>,
    @InjectRepository(LossCase)
    private readonly lossRepo: Repository<LossCase>,
    @InjectRepository(StockMovement)
    private readonly movementsRepo: Repository<StockMovement>,
    @InjectRepository(Station)
    private readonly stationsRepo: Repository<Station>,
  ) {}

  listTanks(stationId?: string) {
    return this.tanksRepo.find({
      where: stationId ? { stationId, isActive: true } : { isActive: true },
      relations: { station: true },
      order: { tankCode: 'ASC' },
    });
  }

  async recordReading(params: {
    tankId: string;
    readingKg: number;
    context: TankReadingContext;
    referenceType?: string;
    referenceId?: string;
    userId?: string;
    notes?: string;
  }) {
    const tank = await this.tanksRepo.findOne({ where: { id: params.tankId } });
    if (!tank) throw new NotFoundException('Tank not found');

    tank.currentStockKg = asDecimal(params.readingKg);
    await this.tanksRepo.save(tank);

    return this.readingsRepo.save(
      this.readingsRepo.create({
        tankId: params.tankId,
        readingKg: asDecimal(params.readingKg),
        context: params.context,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        recordedById: params.userId,
        notes: params.notes,
        recordedAt: new Date(),
      }),
    );
  }

  listReadings(tankId: string) {
    return this.readingsRepo.find({
      where: { tankId },
      order: { recordedAt: 'DESC' },
      take: 100,
    });
  }

  /** LPG-005/006: expected closing = opening + receipts - sales - transfers out - losses */
  async gasReconciliation(stationId: string, periodStart: string, periodEnd: string) {
    const tanks = await this.listTanks(stationId);
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    end.setHours(23, 59, 59, 999);

    const movements = await this.movementsRepo.find({
      where: {
        stationId,
        createdAt: Between(start, end),
      },
      order: { createdAt: 'ASC' },
    });

    let receipts = 0;
    let sales = 0;
    let transfersOut = 0;
    let transfersIn = 0;
    let losses = 0;

    for (const m of movements) {
      const qty = toNumber(m.quantityKg);
      switch (m.type) {
        case StockMovementType.SUPPLIER_DELIVERY:
        case StockMovementType.TRANSFER_IN:
          if (m.type === StockMovementType.SUPPLIER_DELIVERY) receipts += qty;
          else transfersIn += qty;
          break;
        case StockMovementType.REFILL_SALE:
          sales += Math.abs(qty);
          break;
        case StockMovementType.TRANSFER_OUT:
          transfersOut += Math.abs(qty);
          break;
        case StockMovementType.LEAKAGE_LOSS:
        case StockMovementType.STOCK_ADJUSTMENT:
          if (qty < 0) losses += Math.abs(qty);
          break;
        default:
          break;
      }
    }

    const openingReading = await this.readingsRepo.findOne({
      where: { tank: { stationId } },
      order: { recordedAt: 'ASC' },
    });
    const closingReading = await this.readingsRepo.findOne({
      where: { tank: { stationId } },
      order: { recordedAt: 'DESC' },
    });

    const openingKg = openingReading
      ? toNumber(openingReading.readingKg)
      : toNumber(tanks[0]?.currentStockKg ?? 0);
    const physicalKg = closingReading
      ? toNumber(closingReading.readingKg)
      : toNumber(tanks[0]?.currentStockKg ?? 0);

    const expectedKg = round3(
      openingKg + receipts + transfersIn - sales - transfersOut - losses,
    );
    const varianceKg = round3(physicalKg - expectedKg);
    const variancePercent =
      expectedKg > 0 ? round3((varianceKg / expectedKg) * 100) : 0;

    const threshold = DEFAULT_LOSS_THRESHOLD_PERCENT;
    const breach = Math.abs(variancePercent) > threshold;

    let lossCase: LossCase | null = null;
    if (breach) {
      lossCase = await this.lossRepo.save(
        this.lossRepo.create({
          caseNumber: `LOSS-${Date.now().toString().slice(-8)}`,
          stationId,
          tankId: tanks[0]?.id,
          periodStart,
          periodEnd,
          expectedKg: asDecimal(expectedKg),
          physicalKg: asDecimal(physicalKg),
          varianceKg: asDecimal(varianceKg),
          variancePercent: asDecimal(variancePercent, 3),
          thresholdPercent: asDecimal(threshold, 2),
          status: LossCaseStatus.OPEN,
          notes: 'Auto-generated from gas reconciliation threshold breach',
        }),
      );
    }

    return {
      stationId,
      periodStart,
      periodEnd,
      openingKg,
      receiptsKg: round3(receipts),
      transfersInKg: round3(transfersIn),
      salesKg: round3(sales),
      transfersOutKg: round3(transfersOut),
      lossesKg: round3(losses),
      expectedClosingKg: expectedKg,
      physicalClosingKg: physicalKg,
      varianceKg,
      variancePercent,
      thresholdPercent: threshold,
      thresholdBreached: breach,
      lossCaseId: lossCase?.id,
      tanks: tanks.map((t) => ({
        code: t.tankCode,
        capacityKg: toNumber(t.capacityKg),
        currentStockKg: toNumber(t.currentStockKg),
      })),
    };
  }

  listLossCases(stationId?: string) {
    return this.lossRepo.find({
      where: stationId ? { stationId } : {},
      relations: { station: true, tank: true },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async ensureTanksForStation(station: Station) {
    const exists = await this.tanksRepo.findOne({
      where: { stationId: station.id },
    });
    if (exists) return exists;

    return this.tanksRepo.save(
      this.tanksRepo.create({
        tankCode: `${station.code}-TK1`,
        name: `${station.name} Bulk Tank`,
        stationId: station.id,
        capacityKg: station.tankCapacityKg,
        safeWorkingCapacityKg: asDecimal(toNumber(station.tankCapacityKg) * 0.9),
        currentStockKg: station.currentStockKg,
      }),
    );
  }
}
