import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, round2, toNumber } from '../common/decimal';
import { PaymentMethod, SettlementMatchStatus } from '../common/enums';
import { SalePayment } from '../sales/sale-payment.entity';
import { MobileMoneyLine } from './mobile-money-line.entity';

@Injectable()
export class BankingService {
  constructor(
    @InjectRepository(MobileMoneyLine)
    private readonly linesRepo: Repository<MobileMoneyLine>,
    @InjectRepository(SalePayment)
    private readonly paymentsRepo: Repository<SalePayment>,
  ) {}

  async importCsv(params: {
    stationId?: string;
    csvText: string;
  }) {
    const rows = params.csvText
      .trim()
      .split('\n')
      .slice(1)
      .map((line) => line.split(',').map((c) => c.trim()));

    const imported: MobileMoneyLine[] = [];
    for (const [date, reference, amountStr, provider] of rows) {
      if (!reference || !amountStr) continue;
      const amount = round2(Number(amountStr));
      const line = await this.linesRepo.save(
        this.linesRepo.create({
          stationId: params.stationId,
          provider: provider || 'AIRTEL_MONEY',
          txnDate: date,
          reference,
          amount: asDecimal(amount, 2),
          paymentMethod:
            provider?.includes('TNM') || provider?.includes('MPAMBA')
              ? PaymentMethod.TNM_MPAMBA
              : PaymentMethod.AIRTEL_MONEY,
          status: SettlementMatchStatus.UNMATCHED,
        }),
      );
      imported.push(line);
    }

    await this.autoMatch(imported);
    return { imported: imported.length, lines: imported };
  }

  private async autoMatch(lines: MobileMoneyLine[]) {
    for (const line of lines) {
      const payment = await this.paymentsRepo.findOne({
        where: { reference: line.reference },
      });
      if (
        payment &&
        Math.abs(toNumber(payment.amount) - toNumber(line.amount)) < 0.05
      ) {
        line.status = SettlementMatchStatus.MATCHED;
        line.matchedPaymentId = payment.id;
        await this.linesRepo.save(line);
      }
    }
  }

  reconciliation(stationId?: string) {
    return this.linesRepo.find({
      where: stationId ? { stationId } : {},
      relations: { matchedPayment: true, station: true },
      order: { txnDate: 'DESC' },
      take: 200,
    });
  }

  summary(stationId?: string) {
    return this.linesRepo
      .find({ where: stationId ? { stationId } : {} })
      .then((lines) => ({
        total: lines.length,
        matched: lines.filter((l) => l.status === SettlementMatchStatus.MATCHED)
          .length,
        unmatched: lines.filter(
          (l) => l.status === SettlementMatchStatus.UNMATCHED,
        ).length,
        totalAmount: round2(lines.reduce((s, l) => s + toNumber(l.amount), 0)),
      }));
  }
}
