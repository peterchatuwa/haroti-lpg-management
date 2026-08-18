import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CylinderMovementType,
  CylinderStatus,
  StocktakeStatus,
  WorkOrderType,
} from '../common/enums';
import { Customer } from '../customers/customer.entity';
import { MaintenanceWorkOrder } from '../maintenance/work-order.entity';
import { CylinderMovement } from './cylinder-movement.entity';
import { CylinderStocktakeLine } from './cylinder-stocktake-line.entity';
import { CylinderStocktake } from './cylinder-stocktake.entity';
import { Cylinder } from './cylinder.entity';

@Injectable()
export class CylindersService {
  constructor(
    @InjectRepository(Cylinder)
    private readonly cylindersRepo: Repository<Cylinder>,
    @InjectRepository(CylinderMovement)
    private readonly movementsRepo: Repository<CylinderMovement>,
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
    @InjectRepository(CylinderStocktake)
    private readonly stocktakesRepo: Repository<CylinderStocktake>,
    @InjectRepository(CylinderStocktakeLine)
    private readonly stocktakeLinesRepo: Repository<CylinderStocktakeLine>,
    @InjectRepository(MaintenanceWorkOrder)
    private readonly workOrdersRepo: Repository<MaintenanceWorkOrder>,
  ) {}

  findAll(stationId?: string) {
    return this.cylindersRepo.find({
      where: stationId ? { stationId } : {},
      relations: { station: true, customer: true },
      order: { serialNumber: 'ASC' },
      take: 500,
    });
  }

  async findBySerial(serial: string) {
    const cylinder = await this.cylindersRepo.findOne({
      where: { serialNumber: serial },
      relations: { station: true, customer: true },
    });
    if (!cylinder) throw new NotFoundException('Cylinder not found');
    const movements = await this.movementsRepo.find({
      where: { cylinderId: cylinder.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return { cylinder, movements };
  }

  private blockedStatuses = new Set([
    CylinderStatus.CONDEMNED,
    CylinderStatus.DAMAGED,
    CylinderStatus.UNDER_INSPECTION,
  ]);

  assertEligible(cylinder: Cylinder) {
    if (this.blockedStatuses.has(cylinder.status)) {
      throw new BadRequestException(
        `Cylinder ${cylinder.serialNumber} is ${cylinder.status} and cannot be used`,
      );
    }
    if (
      cylinder.nextInspectionDate &&
      new Date(cylinder.nextInspectionDate) < new Date()
    ) {
      throw new BadRequestException(
        `Cylinder ${cylinder.serialNumber} is overdue for hydro test`,
      );
    }
  }

  async swap(params: {
    stationId: string;
    customerId: string;
    incomingSerial: string;
    outgoingSerial: string;
    saleId?: string;
    userId?: string;
  }) {
    const customer = await this.customersRepo.findOne({
      where: { id: params.customerId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const incoming = await this.cylindersRepo.findOne({
      where: { serialNumber: params.incomingSerial },
    });
    const outgoing = await this.cylindersRepo.findOne({
      where: { serialNumber: params.outgoingSerial },
    });
    if (!incoming || !outgoing) {
      throw new NotFoundException('Incoming or outgoing cylinder not found');
    }

    this.assertEligible(outgoing);

    incoming.status = CylinderStatus.WITH_CUSTOMER;
    incoming.customerId = params.customerId;
    incoming.stationId = params.stationId;
    outgoing.status = CylinderStatus.EMPTY;
    outgoing.customerId = null;
    outgoing.stationId = params.stationId;

    await this.cylindersRepo.save([incoming, outgoing]);

    await this.movementsRepo.save([
      this.movementsRepo.create({
        cylinderId: incoming.id,
        type: CylinderMovementType.SWAP_IN,
        toStationId: params.stationId,
        customerId: params.customerId,
        referenceType: params.saleId ? 'Sale' : undefined,
        referenceId: params.saleId,
        notes: `Swap in ${params.incomingSerial}`,
      }),
      this.movementsRepo.create({
        cylinderId: outgoing.id,
        type: CylinderMovementType.SWAP_OUT,
        fromStationId: params.stationId,
        customerId: params.customerId,
        referenceType: params.saleId ? 'Sale' : undefined,
        referenceId: params.saleId,
        notes: `Swap out ${params.outgoingSerial}`,
      }),
    ]);

    return { incoming, outgoing, customer };
  }

  listMovements(cylinderId?: string) {
    return this.movementsRepo.find({
      where: cylinderId ? { cylinderId } : {},
      relations: { cylinder: true, customer: true, toStation: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async passport(id: string) {
    const cylinder = await this.cylindersRepo.findOne({
      where: { id },
      relations: { station: true, customer: true },
    });
    if (!cylinder) throw new NotFoundException('Cylinder not found');

    const movements = await this.movementsRepo.find({
      where: { cylinderId: id },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const hydroHistory = await this.workOrdersRepo.find({
      where: {
        cylinderId: id,
        type: WorkOrderType.CYLINDER_HYDRO_TEST,
      },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    if (!cylinder.barcode) {
      cylinder.barcode = `QR-${cylinder.id.slice(0, 8).toUpperCase()}`;
      await this.cylindersRepo.save(cylinder);
    }

    return {
      cylinder,
      movements,
      hydroHistory,
      qrPayload: `haroti:cylinder:${cylinder.id}`,
      eligible: this.isEligible(cylinder),
    };
  }

  private isEligible(cylinder: Cylinder) {
    try {
      this.assertEligible(cylinder);
      return true;
    } catch {
      return false;
    }
  }

  async assertSerialEligible(serial: string) {
    const cylinder = await this.cylindersRepo.findOne({
      where: { serialNumber: serial },
    });
    if (!cylinder) {
      throw new NotFoundException(`Cylinder ${serial} not found`);
    }
    this.assertEligible(cylinder);
    return cylinder;
  }

  listStocktakes(stationId?: string) {
    return this.stocktakesRepo.find({
      where: stationId ? { stationId } : {},
      relations: { station: true, lines: true },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async startStocktake(stationId: string, userId?: string) {
    const cylinders = await this.cylindersRepo.find({ where: { stationId } });
    const stocktake = await this.stocktakesRepo.save(
      this.stocktakesRepo.create({
        stationId,
        startedById: userId,
        status: StocktakeStatus.OPEN,
        expectedCount: cylinders.length,
        scannedCount: 0,
        lines: cylinders.map((c) =>
          this.stocktakeLinesRepo.create({
            cylinderId: c.id,
            serialNumber: c.serialNumber,
            expected: true,
            scanned: false,
            exception: false,
          }),
        ),
      }),
    );
    return this.stocktakesRepo.findOne({
      where: { id: stocktake.id },
      relations: { lines: true, station: true },
    });
  }

  async scanStocktake(stocktakeId: string, serialNumber: string) {
    const stocktake = await this.stocktakesRepo.findOne({
      where: { id: stocktakeId, status: StocktakeStatus.OPEN },
      relations: { lines: true },
    });
    if (!stocktake) throw new NotFoundException('Open stocktake not found');

    let line = stocktake.lines.find(
      (l) => l.serialNumber.toLowerCase() === serialNumber.toLowerCase(),
    );

    if (!line) {
      line = await this.stocktakeLinesRepo.save(
        this.stocktakeLinesRepo.create({
          stocktakeId,
          serialNumber,
          expected: false,
          scanned: true,
          exception: true,
        }),
      );
    } else {
      line.scanned = true;
      await this.stocktakeLinesRepo.save(line);
    }

    stocktake.scannedCount = stocktake.lines.filter((l) => l.scanned).length;
    await this.stocktakesRepo.save(stocktake);
    return line;
  }

  async closeStocktake(stocktakeId: string) {
    const stocktake = await this.stocktakesRepo.findOne({
      where: { id: stocktakeId },
      relations: { lines: true },
    });
    if (!stocktake) throw new NotFoundException('Stocktake not found');
    if (stocktake.status === StocktakeStatus.CLOSED) {
      throw new BadRequestException('Stocktake already closed');
    }
    stocktake.status = StocktakeStatus.CLOSED;
    stocktake.closedAt = new Date();
    stocktake.scannedCount = stocktake.lines.filter((l) => l.scanned).length;
    await this.stocktakesRepo.save(stocktake);

    const exceptions = stocktake.lines.filter(
      (l) => l.exception || (l.expected && !l.scanned),
    );
    return { stocktake, exceptions };
  }
}
