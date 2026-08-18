import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, round2, toNumber } from '../common/decimal';
import {
  PurchaseOrderStatus,
  SupplierInvoiceStatus,
  ThreeWayMatchStatus,
} from '../common/enums';
import { PurchaseOrder } from './purchase-order.entity';
import { SupplierInvoice } from './supplier-invoice.entity';

/** Default variance tolerance for three-way match (2%). */
export const THREE_WAY_TOLERANCE_PCT = 2;

@Injectable()
export class ThreeWayMatchService {
  constructor(
    @InjectRepository(SupplierInvoice)
    private readonly invoicesRepo: Repository<SupplierInvoice>,
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: Repository<PurchaseOrder>,
  ) {}

  list() {
    return this.invoicesRepo.find({
      relations: { supplier: true, purchaseOrder: true },
      order: { invoiceDate: 'DESC' },
      take: 100,
    });
  }

  async register(dto: {
    invoiceNumber: string;
    supplierId: string;
    purchaseOrderId?: string;
    invoiceDate: string;
    dueDate?: string;
    amount: number;
    taxAmount?: number;
    notes?: string;
  }) {
    const duplicate = await this.invoicesRepo.findOne({
      where: { invoiceNumber: dto.invoiceNumber, supplierId: dto.supplierId },
    });
    if (duplicate) {
      throw new BadRequestException('Duplicate supplier invoice number');
    }

    const invoice = await this.invoicesRepo.save(
      this.invoicesRepo.create({
        invoiceNumber: dto.invoiceNumber,
        supplierId: dto.supplierId,
        purchaseOrderId: dto.purchaseOrderId,
        invoiceDate: dto.invoiceDate,
        dueDate: dto.dueDate,
        amount: asDecimal(dto.amount, 2),
        taxAmount: asDecimal(dto.taxAmount ?? 0, 2),
        notes: dto.notes,
        status: SupplierInvoiceStatus.REGISTERED,
        matchStatus: ThreeWayMatchStatus.PENDING,
      }),
    );

    if (dto.purchaseOrderId) {
      return this.runMatch(invoice.id);
    }
    return invoice;
  }

  async runMatch(invoiceId: string) {
    const invoice = await this.invoicesRepo.findOne({
      where: { id: invoiceId },
      relations: { purchaseOrder: { lines: true } },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (!invoice.purchaseOrderId || !invoice.purchaseOrder) {
      throw new BadRequestException(
        'Invoice is not linked to a purchase order',
      );
    }

    const po = invoice.purchaseOrder;
    const poAmount = toNumber(po.totalAmount);
    const grnReceived = po.lines.every((l) => l.quantityReceived >= l.quantity);
    const invoiceAmount = toNumber(invoice.amount);
    const variance = round2(invoiceAmount - poAmount);
    const variancePct = poAmount > 0 ? Math.abs(variance / poAmount) * 100 : 0;

    let matchStatus = ThreeWayMatchStatus.MATCHED;
    if (!grnReceived) {
      matchStatus = ThreeWayMatchStatus.VARIANCE;
    } else if (variancePct > THREE_WAY_TOLERANCE_PCT) {
      matchStatus = ThreeWayMatchStatus.VARIANCE;
    }

    invoice.matchStatus = matchStatus;
    invoice.varianceAmount = asDecimal(variance, 2);
    invoice.status =
      matchStatus === ThreeWayMatchStatus.MATCHED
        ? SupplierInvoiceStatus.MATCHED
        : SupplierInvoiceStatus.VARIANCE;

    return this.invoicesRepo.save(invoice);
  }

  async approveVariance(invoiceId: string) {
    const invoice = await this.invoicesRepo.findOne({
      where: { id: invoiceId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.matchStatus !== ThreeWayMatchStatus.VARIANCE) {
      throw new BadRequestException('Invoice has no variance to approve');
    }
    invoice.matchStatus = ThreeWayMatchStatus.APPROVED;
    invoice.status = SupplierInvoiceStatus.MATCHED;
    return this.invoicesRepo.save(invoice);
  }

  async assertPayable(purchaseOrderId: string) {
    const invoice = await this.invoicesRepo.findOne({
      where: { purchaseOrderId },
      order: { createdAt: 'DESC' },
    });
    if (!invoice) {
      throw new BadRequestException(
        'Register a supplier invoice before payment (three-way match)',
      );
    }
    if (
      invoice.matchStatus !== ThreeWayMatchStatus.MATCHED &&
      invoice.matchStatus !== ThreeWayMatchStatus.APPROVED
    ) {
      throw new BadRequestException(
        `Invoice ${invoice.invoiceNumber} requires three-way match approval (status: ${invoice.matchStatus})`,
      );
    }
    const po = await this.poRepo.findOne({ where: { id: purchaseOrderId } });
    if (po?.status !== PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException('PO must be received before payment');
    }
    return invoice;
  }

  async markPaid(purchaseOrderId: string) {
    const invoice = await this.invoicesRepo.findOne({
      where: { purchaseOrderId },
      order: { createdAt: 'DESC' },
    });
    if (invoice) {
      invoice.status = SupplierInvoiceStatus.PAID;
      await this.invoicesRepo.save(invoice);
    }
  }
}
