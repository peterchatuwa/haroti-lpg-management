import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CylinderMovementType, CylinderStatus } from '../common/enums';
import { Customer } from '../customers/customer.entity';
import { CylinderMovement } from './cylinder-movement.entity';
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
}
