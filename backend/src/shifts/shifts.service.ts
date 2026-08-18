import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { asDecimal, round2, round3, toNumber } from '../common/decimal';
import {
  ExpenseStatus,
  PaymentMethod,
  ShiftStatus,
  UserRole,
} from '../common/enums';
import { Expense } from '../expenses/expense.entity';
import { Sale } from '../sales/sale.entity';
import { StationsService } from '../stations/stations.service';
import { TankReadingContext } from '../common/enums';
import { TanksService } from '../tanks/tanks.service';
import { CloseShiftDto, OpenShiftDto } from './dto/shift.dto';
import { Shift } from './shift.entity';

const SHIFT_APPROVER_ROLES = new Set<UserRole>([
  UserRole.SYSTEM_ADMIN,
  UserRole.DIRECTOR,
  UserRole.OPERATIONS_MANAGER,
  UserRole.STATION_MANAGER,
]);

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift) private readonly shiftsRepo: Repository<Shift>,
    @InjectRepository(Sale) private readonly salesRepo: Repository<Sale>,
    @InjectRepository(Expense)
    private readonly expensesRepo: Repository<Expense>,
    private readonly stationsService: StationsService,
    private readonly tanksService: TanksService,
  ) {}

  isShiftLocked(shift: Shift): boolean {
    return shift.status !== ShiftStatus.OPEN || shift.lockedAt != null;
  }

  async requireOpenShiftForSale(
    shiftId: string,
    stationId: string,
    attendantId: string,
  ): Promise<Shift> {
    const shift = await this.shiftsRepo.findOne({ where: { id: shiftId } });
    if (!shift) {
      throw new BadRequestException('Shift not found');
    }
    if (shift.status !== ShiftStatus.OPEN) {
      throw new BadRequestException(
        'Sales require an open shift; this shift is closed or pending approval',
      );
    }
    if (shift.stationId !== stationId) {
      throw new BadRequestException('Shift does not belong to this station');
    }
    if (shift.attendantId !== attendantId) {
      throw new BadRequestException(
        'Sale must be recorded on your own open shift',
      );
    }
    return shift;
  }

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
    const tank = await this.tanksService.ensureTanksForStation(station);
    const shift = this.shiftsRepo.create({
      stationId: dto.stationId,
      attendantId,
      status: ShiftStatus.OPEN,
      openedAt: new Date(),
      openingCashFloat: asDecimal(dto.openingCashFloat, 2),
      openingLpgStockKg: station.currentStockKg,
      openingCylinderCount: dto.openingCylinderCount ?? 0,
    });
    const saved = await this.shiftsRepo.save(shift);

    await this.tanksService.recordReading({
      tankId: tank.id,
      readingKg: toNumber(station.currentStockKg),
      context: TankReadingContext.SHIFT_OPEN,
      referenceType: 'Shift',
      referenceId: saved.id,
      userId: attendantId,
    });

    return saved;
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
          case PaymentMethod.PAYCHANGU:
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
    const expectedLpg = round3(toNumber(shift.openingLpgStockKg) - lpgSoldKg);
    const stockVariance = round3(dto.physicalLpgStockKg - expectedLpg);

    const hasVariance =
      Math.abs(cashVariance) > 0.01 || Math.abs(stockVariance) > 0.01;

    if (hasVariance) {
      shift.status = ShiftStatus.PENDING_APPROVAL;
    } else {
      shift.status = ShiftStatus.CLOSED;
      shift.approvedById = userId;
      shift.lockedAt = new Date();
    }

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

    const saved = await this.shiftsRepo.save(shift);

    const tank = await this.tanksService.ensureTanksForStation(
      await this.stationsService.findOne(shift.stationId),
    );
    await this.tanksService.recordReading({
      tankId: tank.id,
      readingKg: dto.physicalLpgStockKg,
      context: TankReadingContext.SHIFT_CLOSE,
      referenceType: 'Shift',
      referenceId: saved.id,
      userId,
      notes: dto.varianceNotes,
    });

    return saved;
  }

  async approveShift(id: string, approverId: string, approverRole: UserRole) {
    if (!SHIFT_APPROVER_ROLES.has(approverRole)) {
      throw new ForbiddenException('Insufficient role to approve shifts');
    }

    const shift = await this.shiftsRepo.findOne({ where: { id } });
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }
    if (shift.status !== ShiftStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Shift is not awaiting approval');
    }
    if (shift.attendantId === approverId) {
      throw new ForbiddenException(
        'Cashier cannot approve their own shift variance',
      );
    }

    shift.status = ShiftStatus.CLOSED;
    shift.approvedById = approverId;
    shift.lockedAt = new Date();
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
