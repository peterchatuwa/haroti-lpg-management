import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PDFDocument from 'pdfkit';
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
      relations: {
        purchaseOrder: {
          supplier: { customer: true },
          destinationStation: true,
          lines: true,
        },
      },
    });
  }

  async generatePdf(doc: ProcurementDocument): Promise<Buffer> {
    const payload = JSON.parse(doc.payload) as ReturnType<
      typeof this.buildPayload
    >;

    return new Promise((resolve, reject) => {
      const pdf = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdf.on('end', () => resolve(Buffer.concat(chunks)));
      pdf.on('error', reject);

      pdf.fontSize(18).text(payload.title, { align: 'center' });
      pdf.moveDown(0.5);
      pdf.fontSize(11).text(payload.documentNumber, { align: 'center' });
      pdf.text(new Date(payload.issuedAt).toLocaleDateString('en-GB'), {
        align: 'center',
      });
      pdf.moveDown();

      pdf.fontSize(10).text('Vendor', { underline: true });
      pdf.text(`${payload.vendor.name ?? ''} (${payload.vendor.code ?? ''})`);
      if (payload.vendor.phone) pdf.text(`Tel: ${payload.vendor.phone}`);
      if (payload.vendor.address) pdf.text(payload.vendor.address);
      pdf.moveDown();

      pdf.text('Buyer', { underline: true });
      pdf.text(`${payload.buyer.name}`);
      pdf.text(payload.buyer.address);
      pdf.moveDown();

      pdf.text(
        `Deliver to: ${payload.destination.code} — ${payload.destination.name}`,
      );
      pdf.moveDown();

      const colX = [50, 220, 280, 350, 430];
      pdf.font('Helvetica-Bold');
      pdf.text('Item', colX[0], pdf.y, { width: 160 });
      pdf.text('Qty', colX[1], pdf.y - 12, { width: 50 });
      pdf.text('Unit', colX[2], pdf.y - 12, { width: 60 });
      pdf.text('Landed', colX[3], pdf.y - 12, { width: 70 });
      pdf.text('Total', colX[4], pdf.y - 12, { width: 80 });
      pdf.moveDown(0.5);
      pdf.font('Helvetica');

      for (const line of payload.lines) {
        const y = pdf.y;
        pdf.text(line.description, colX[0], y, { width: 160 });
        pdf.text(String(line.quantity), colX[1], y);
        pdf.text(line.unitCost.toFixed(2), colX[2], y);
        pdf.text(line.landedUnitCost.toFixed(2), colX[3], y);
        pdf.text(line.lineTotal.toFixed(2), colX[4], y);
        pdf.moveDown(0.8);
      }

      pdf.moveDown();
      pdf.text(`Subtotal: ${payload.subtotal.toFixed(2)} ${payload.currency}`);
      pdf.text(`Freight: ${payload.freightCost.toFixed(2)}`);
      pdf.text(`Duty: ${payload.customsDuty.toFixed(2)}`);
      pdf.text(`Clearing: ${payload.clearingFees.toFixed(2)}`);
      pdf
        .font('Helvetica-Bold')
        .text(`Total: ${payload.totalAmount.toFixed(2)} ${payload.currency}`);
      if (payload.notes) {
        pdf.moveDown();
        pdf.font('Helvetica').fontSize(9).text(`Notes: ${payload.notes}`);
      }

      pdf.end();
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
