import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, round2, toNumber } from '../common/decimal';
import { PurchaseOrderStatus, UserRole } from '../common/enums';
import { FinanceService } from '../finance/finance.service';
import { AccessoriesService } from '../accessories/accessories.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderLine } from './purchase-order-line.entity';
import { PurchaseOrder } from './purchase-order.entity';

const APPROVAL_THRESHOLDS: Record<string, number> = {
  [UserRole.STATION_MANAGER]: 500000,
  [UserRole.OPERATIONS_MANAGER]: 2000000,
  [UserRole.FINANCE_MANAGER]: 10000000,
  [UserRole.DIRECTOR]: Infinity,
};

@Injectable()
export class ProcurementService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderLine)
    private readonly lineRepo: Repository<PurchaseOrderLine>,
    private readonly financeService: FinanceService,
    private readonly accessoriesService: AccessoriesService,
  ) {}

  findAll(status?: PurchaseOrderStatus) {
    return this.poRepo.find({
      where: status ? { status } : {},
      relations: { supplier: true, destinationStation: true, lines: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async create(dto: CreatePurchaseOrderDto, userId: string) {
    const stamp = Date.now().toString().slice(-8);
    const landedExtras =
      (dto.freightCost ?? 0) + (dto.customsDuty ?? 0) + (dto.clearingFees ?? 0);
    const lineTotal = dto.lines.reduce(
      (sum, l) => sum + l.quantity * l.unitCost,
      0,
    );
    const total = round2(lineTotal + landedExtras);

    const lines = dto.lines.map((l) => {
      const base = l.quantity * l.unitCost;
      const share = lineTotal > 0 ? (base / lineTotal) * landedExtras : 0;
      const landed = round2(l.unitCost + share / l.quantity);
      return this.lineRepo.create({
        productId: l.productId,
        itemDescription: l.itemDescription,
        quantity: l.quantity,
        unitCost: asDecimal(l.unitCost, 2),
        landedUnitCost: asDecimal(landed, 2),
        lineTotal: asDecimal(round2(l.quantity * landed), 2),
      });
    });

    const po = this.poRepo.create({
      poNumber: `PO-${stamp}`,
      supplierId: dto.supplierId,
      destinationStationId: dto.destinationStationId,
      status: PurchaseOrderStatus.PENDING_APPROVAL,
      currency: dto.currency,
      freightCost: asDecimal(dto.freightCost ?? 0, 2),
      customsDuty: asDecimal(dto.customsDuty ?? 0, 2),
      clearingFees: asDecimal(dto.clearingFees ?? 0, 2),
      totalAmount: asDecimal(total, 2),
      notes: dto.notes,
      createdById: userId,
      lines,
    });

    return this.poRepo.save(po);
  }

  async approve(id: string, userId: string, role: UserRole) {
    const po = await this.poRepo.findOne({
      where: { id },
      relations: { lines: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== PurchaseOrderStatus.PENDING_APPROVAL) {
      throw new BadRequestException('PO is not pending approval');
    }
    const limit = APPROVAL_THRESHOLDS[role] ?? 0;
    if (toNumber(po.totalAmount) > limit) {
      throw new BadRequestException(
        `Amount exceeds approval limit for ${role}`,
      );
    }
    po.status = PurchaseOrderStatus.APPROVED;
    po.approvedById = userId;
    return this.poRepo.save(po);
  }

  async receive(id: string, userId: string) {
    const po = await this.poRepo.findOne({
      where: { id },
      relations: { lines: true, destinationStation: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (
      po.status !== PurchaseOrderStatus.APPROVED &&
      po.status !== PurchaseOrderStatus.ORDERED
    ) {
      throw new BadRequestException('PO must be approved before receiving');
    }

    const stationId = po.destinationStationId;
    if (!stationId) {
      throw new BadRequestException('Destination station required for GRN');
    }

    for (const line of po.lines) {
      if (!line.productId) continue;
      await this.accessoriesService.receiveStock({
        stationId,
        productId: line.productId,
        quantity: line.quantity - line.quantityReceived,
        batchNumber: `GRN-${po.poNumber}`,
      });
      line.quantityReceived = line.quantity;
      await this.lineRepo.save(line);
    }

    po.status = PurchaseOrderStatus.RECEIVED;
    await this.poRepo.save(po);
    await this.financeService.postAccessoryGrn(toNumber(po.totalAmount), po.id);

    return po;
  }

  async submitForApproval(id: string) {
    const po = await this.poRepo.findOne({ where: { id } });
    if (!po) throw new NotFoundException('Purchase order not found');
    po.status = PurchaseOrderStatus.PENDING_APPROVAL;
    return this.poRepo.save(po);
  }
}
