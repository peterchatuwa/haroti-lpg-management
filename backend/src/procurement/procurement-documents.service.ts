import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toNumber } from '../common/decimal';
import { ProcurementDocumentType } from '../common/enums';
import { ProcurementDocument } from './procurement-document.entity';
import { PurchaseOrder } from './purchase-order.entity';

const DOC_PREFIX: Record<ProcurementDocumentType, string> = {
  [ProcurementDocumentType.QUOTATION]: 'QUO',
  [ProcurementDocumentType.PURCHASE_ORDER]: 'PO',
  [ProcurementDocumentType.INVOICE]: 'INV',
  [ProcurementDocumentType.RECEIPT]: 'RCP',
};

@Injectable()
export class ProcurementDocumentsService {
  constructor(
    @InjectRepository(ProcurementDocument)
    private readonly docsRepo: Repository<ProcurementDocument>,
  ) {}

  async generate(
    po: PurchaseOrder,
    type: ProcurementDocumentType,
    userId?: string,
  ) {
    const existing = await this.docsRepo.findOne({
      where: { purchaseOrderId: po.id, documentType: type },
    });
    if (existing) return existing;

    const documentNumber =
      type === ProcurementDocumentType.PURCHASE_ORDER
        ? po.poNumber
        : `${DOC_PREFIX[type]}-${po.poNumber.replace(/^PO-/, '')}`;

    const payload = this.buildPayload(po, type, documentNumber);

    return this.docsRepo.save(
      this.docsRepo.create({
        purchaseOrderId: po.id,
        documentType: type,
        documentNumber,
        issuedAt: new Date(),
        payload: JSON.stringify(payload),
        generatedById: userId,
      }),
    );
  }

  listForOrder(purchaseOrderId: string) {
    return this.docsRepo.find({
      where: { purchaseOrderId },
      order: { issuedAt: 'ASC' },
    });
  }

  async findOne(id: string) {
    return this.docsRepo.findOne({
      where: { id },
      relations: { purchaseOrder: { supplier: { customer: true }, destinationStation: true, lines: true } },
    });
  }

  private buildPayload(
    po: PurchaseOrder,
    type: ProcurementDocumentType,
    documentNumber: string,
  ) {
    const lines = (po.lines ?? []).map((l) => ({
      description: l.itemDescription,
      quantity: l.quantity,
      unitCost: toNumber(l.unitCost),
      landedUnitCost: toNumber(l.landedUnitCost),
      lineTotal: toNumber(l.lineTotal),
    }));
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

    return {
      documentType: type,
      documentNumber,
      issuedAt: new Date().toISOString(),
      title: this.titleFor(type),
      buyer: {
        name: 'Haroti Gas Ltd',
        address: 'Lilongwe, Malawi',
        taxNumber: 'HAROTI-TIN-001',
      },
      vendor: {
        code: po.supplier?.code,
        name: po.supplier?.name,
        phone: po.supplier?.phone,
        address: po.supplier?.address,
        customerCode: po.supplier?.customer?.customerCode,
        customerName: po.supplier?.customer?.fullName,
      },
      purchaseOrderNumber: po.poNumber,
      destination: po.destinationStation
        ? {
            code: po.destinationStation.code,
            name: po.destinationStation.name,
          }
        : { code: 'CENTRAL', name: 'Central Hub' },
      currency: po.currency,
      status: po.status,
      lines,
      subtotal,
      freightCost: toNumber(po.freightCost),
      customsDuty: toNumber(po.customsDuty),
      clearingFees: toNumber(po.clearingFees),
      totalAmount: toNumber(po.totalAmount),
      notes: po.notes ?? null,
    };
  }

  private titleFor(type: ProcurementDocumentType) {
    switch (type) {
      case ProcurementDocumentType.QUOTATION:
        return 'Procurement Quotation';
      case ProcurementDocumentType.PURCHASE_ORDER:
        return 'Purchase Order';
      case ProcurementDocumentType.INVOICE:
        return 'Supplier Invoice';
      case ProcurementDocumentType.RECEIPT:
        return 'Goods Received Note / Receipt';
      default:
        return 'Procurement Document';
    }
  }
}
