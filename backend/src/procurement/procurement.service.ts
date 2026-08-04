import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, round2, toNumber } from '../common/decimal';
import {
  ProcurementDocumentType,
  PurchaseOrderStatus,
  UserRole,
} from '../common/enums';
import { FinanceService } from '../finance/finance.service';
import { AccessoriesService } from '../accessories/accessories.service';
import { Supplier } from '../suppliers/supplier.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ProcurementDocumentsService } from './procurement-documents.service';
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
    @InjectRepository(Supplier)
    private readonly suppliersRepo: Repository<Supplier>,
    private readonly financeService: FinanceService,
    private readonly accessoriesService: AccessoriesService,
    private readonly documentsService: ProcurementDocumentsService,
  ) {}

  findAll(status?: PurchaseOrderStatus) {
    return this.poRepo.find({
      where: status ? { status } : {},
      relations: {
        supplier: { customer: true },
        destinationStation: true,
        lines: true,
        documents: true,
      },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findOne(id: string) {
    const po = await this.poRepo.findOne({
      where: { id },
      relations: {
        supplier: { customer: true },
        destinationStation: true,
        lines: true,
        documents: true,
      },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async create(dto: CreatePurchaseOrderDto, userId: string) {
    const supplier = await this.suppliersRepo.findOne({
      where: { id: dto.supplierId, isActive: true },
      relations: { customer: true },
    });
    if (!supplier) throw new NotFoundException('Vendor not found');
    if (!supplier.customerId) {
      throw new BadRequestException(
        'Procurement is only allowed from customer-linked vendors',
      );
    }

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

    const po = await this.poRepo.save(
      this.poRepo.create({
        poNumber: `PO-${stamp}`,
        supplierId: dto.supplierId,
        destinationStationId: dto.destinationStationId,
        status: PurchaseOrderStatus.DRAFT,
        currency: dto.currency,
        freightCost: asDecimal(dto.freightCost ?? 0, 2),
        customsDuty: asDecimal(dto.customsDuty ?? 0, 2),
        clearingFees: asDecimal(dto.clearingFees ?? 0, 2),
        totalAmount: asDecimal(total, 2),
        notes: dto.notes,
        createdById: userId,
        lines,
      }),
    );

    const full = await this.findOne(po.id);
    await this.documentsService.generate(
      full,
      ProcurementDocumentType.QUOTATION,
      userId,
    );
    return this.findOne(po.id);
  }

  async submitForApproval(id: string, userId: string) {
    const po = await this.findOne(id);
    if (po.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft orders can be submitted');
    }
    po.status = PurchaseOrderStatus.PENDING_APPROVAL;
    await this.poRepo.save(po);
    return this.findOne(id);
  }

  async approve(id: string, userId: string, role: UserRole) {
    const po = await this.findOne(id);
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
    await this.poRepo.save(po);

    const updated = await this.findOne(id);
    await this.documentsService.generate(
      updated,
      ProcurementDocumentType.PURCHASE_ORDER,
      userId,
    );
    return this.findOne(id);
  }

  async placeOrder(id: string, userId: string) {
    const po = await this.findOne(id);
    if (po.status !== PurchaseOrderStatus.APPROVED) {
      throw new BadRequestException('PO must be approved before ordering');
    }
    po.status = PurchaseOrderStatus.ORDERED;
    await this.poRepo.save(po);

    const updated = await this.findOne(id);
    await this.documentsService.generate(
      updated,
      ProcurementDocumentType.INVOICE,
      userId,
    );
    return this.findOne(id);
  }

  async receive(id: string, userId: string) {
    const po = await this.findOne(id);
    if (
      po.status !== PurchaseOrderStatus.ORDERED &&
      po.status !== PurchaseOrderStatus.APPROVED
    ) {
      throw new BadRequestException('PO must be ordered before receiving');
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

    const updated = await this.findOne(id);
    await this.documentsService.generate(
      updated,
      ProcurementDocumentType.RECEIPT,
      userId,
    );
    return this.findOne(id);
  }

  async pay(id: string, userId: string, paymentReference?: string) {
    const po = await this.findOne(id);
    if (po.status !== PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException('PO must be received before payment');
    }

    await this.financeService.postSupplierPayment(toNumber(po.totalAmount), po.id);
    po.status = PurchaseOrderStatus.PAID;
    po.notes = paymentReference
      ? `${po.notes ?? ''}\nPayment ref: ${paymentReference}`.trim()
      : po.notes;
    await this.poRepo.save(po);
    return this.findOne(id);
  }

  listDocuments(purchaseOrderId: string) {
    return this.documentsService.listForOrder(purchaseOrderId);
  }

  getDocument(id: string) {
    return this.documentsService.findOne(id);
  }

  async getDocumentPdf(id: string) {
    const doc = await this.documentsService.findOne(id);
    if (!doc) throw new NotFoundException('Document not found');
    const buffer = await this.documentsService.generatePdf(doc);
    const filename = `${doc.documentNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
    return { buffer, filename };
  }
}
