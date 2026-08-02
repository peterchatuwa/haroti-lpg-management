import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { asDecimal, round2, round3, toNumber } from '../common/decimal';
import { ExpenseStatus, PaymentMethod, ShiftStatus } from '../common/enums';
import { Expense } from '../expenses/expense.entity';
import { Sale } from '../sales/sale.entity';
import { StationsService } from '../stations/stations.service';
import { CloseShiftDto, OpenShiftDto } from './dto/shift.dto';
import { Shift } from './shift.entity';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift) private readonly shiftsRepo: Repository<Shift>,
    @InjectRepository(Sale) private readonly salesRepo: Repository<Sale>,
    @InjectRepository(Expense)
    private readonly expensesRepo: Repository<Expense>,
    private readonly stationsService: StationsService,
  ) {}

  async openShift(dto: OpenShiftDto, attendantId: string) {
    const open = await this.shiftsRepo.findOne({
      where: {
        attendantId,
        stationId: dto.stationId,
        status: ShiftStatus.OPEN,
      },
    });
    if (open) {
      throw new BadRequestException('Attendant already has an open shift');
    }

    const station = await this.stationsService.findOne(dto.stationId);
    const shift = this.shiftsRepo.create({
      stationId: dto.stationId,
      attendantId,
      status: ShiftStatus.OPEN,
      openedAt: new Date(),
      openingCashFloat: asDecimal(dto.openingCashFloat, 2),
      openingLpgStockKg: station.currentStockKg,
      openingCylinderCount: dto.openingCylinderCount ?? 0,
    });
    return this.shiftsRepo.save(shift);
  }

  async closeShift(id: string, dto: CloseShiftDto, userId: string) {
    const shift = await this.shiftsRepo.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }
    if (shift.status !== ShiftStatus.OPEN) {
      throw new BadRequestException('Shift is already closed');
    }

    const sales = await this.salesRepo.find({ where: { shiftId: id } });
    const expenses = await this.expensesRepo.find({
      where: {
        shiftId: id,
        status: In([ExpenseStatus.APPROVED, ExpenseStatus.SUBMITTED]),
      },
    });

    let cashSales = 0;
    let mobileMoneySales = 0;
    let bankSales = 0;
    let creditSales = 0;
    let lpgSoldKg = 0;

    for (const sale of sales) {
      lpgSoldKg += toNumber(sale.lpgQuantityKg);
      for (const payment of await this.salesRepo
        .createQueryBuilder('s')
        .relation(Sale, 'payments')
        .of(sale)
        .loadMany()) {
        const amount = toNumber(payment.amount);
        switch (payment.method) {
          case PaymentMethod.CASH:
            cashSales += amount;
            break;
          case PaymentMethod.AIRTEL_MONEY:
          case PaymentMethod.TNM_MPAMBA:
            mobileMoneySales += amount;
            break;
          case PaymentMethod.BANK_TRANSFER:
          case PaymentMethod.CARD:
            bankSales += amount;
            break;
          case PaymentMethod.CUSTOMER_ACCOUNT:
            creditSales += amount;
            break;
          default:
            cashSales += amount;
        }
      }
    }

    const cashExpenses = expenses
      .filter((e) => e.paymentMethod === 'CASH')
      .reduce((sum, e) => sum + toNumber(e.amount), 0);
    const cashDeposited = dto.cashDeposited ?? 0;
    const expectedCash = round2(
      toNumber(shift.openingCashFloat) +
        cashSales -
        cashExpenses -
        cashDeposited,
    );
    const cashVariance = round2(dto.cashCounted - expectedCash);
    const expectedLpg = round3(
      toNumber(shift.openingLpgStockKg) - lpgSoldKg,
    );
    const stockVariance = round3(dto.physicalLpgStockKg - expectedLpg);

    shift.status =
      Math.abs(cashVariance) > 100 || Math.abs(stockVariance) > 2
        ? ShiftStatus.PENDING_APPROVAL
        : ShiftStatus.CLOSED;
    shift.closedAt = new Date();
    shift.cashSales = asDecimal(cashSales, 2);
    shift.mobileMoneySales = asDecimal(mobileMoneySales, 2);
    shift.bankSales = asDecimal(bankSales, 2);
    shift.creditSales = asDecimal(creditSales, 2);
    shift.cashExpenses = asDecimal(cashExpenses, 2);
    shift.cashDeposited = asDecimal(cashDeposited, 2);
    shift.expectedCash = asDecimal(expectedCash, 2);
    shift.cashCounted = asDecimal(dto.cashCounted, 2);
    shift.cashVariance = asDecimal(cashVariance, 2);
    shift.lpgSoldKg = asDecimal(lpgSoldKg);
    shift.expectedLpgStockKg = asDecimal(expectedLpg);
    shift.physicalLpgStockKg = asDecimal(dto.physicalLpgStockKg);
    shift.stockVarianceKg = asDecimal(stockVariance);
    shift.closingCylinderCount = dto.closingCylinderCount;
    shift.varianceNotes = dto.varianceNotes;
    if (shift.status === ShiftStatus.CLOSED) {
      shift.approvedById = userId;
    }

    return this.shiftsRepo.save(shift);
  }

  findAll(stationId?: string) {
    return this.shiftsRepo.find({
      where: stationId ? { stationId } : {},
      order: { openedAt: 'DESC' },
      take: 50,
      relations: { station: true, attendant: true },
    });
  }

  async currentOpen(attendantId: string, stationId?: string) {
    return this.shiftsRepo.findOne({
      where: {
        attendantId,
        status: ShiftStatus.OPEN,
        ...(stationId ? { stationId } : {}),
      },
      relations: { station: true },
    });
  }
}
