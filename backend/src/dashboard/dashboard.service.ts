import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { round2, round3, toNumber } from '../common/decimal';
import { Requisition } from '../requisitions/requisition.entity';
import {
  CylinderStatus,
  ExpenseStatus,
  RequisitionStatus,
  SaleStatus,
  ShiftStatus,
  TransferStatus,
} from '../common/enums';
import { Customer } from '../customers/customer.entity';
import { Cylinder } from '../cylinders/cylinder.entity';
import { Expense } from '../expenses/expense.entity';
import { Sale } from '../sales/sale.entity';
import { Shift } from '../shifts/shift.entity';
import { StationsService } from '../stations/stations.service';
import { Transfer } from '../transfers/transfer.entity';

@Injectable()
export class DashboardService {
  constructor(
    private readonly stationsService: StationsService,
    @InjectRepository(Sale) private readonly salesRepo: Repository<Sale>,
    @InjectRepository(Expense)
    private readonly expensesRepo: Repository<Expense>,
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
    @InjectRepository(Cylinder)
    private readonly cylindersRepo: Repository<Cylinder>,
    @InjectRepository(Shift) private readonly shiftsRepo: Repository<Shift>,
    @InjectRepository(Transfer)
    private readonly transfersRepo: Repository<Transfer>,
    @InjectRepository(Requisition)
    private readonly requisitionsRepo: Repository<Requisition>,
  ) {}

  private dayBounds() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  async overview() {
    const stock = await this.stationsService.getStockSummary();
    const { start, end } = this.dayBounds();

    const todaySales = await this.salesRepo.find({
      where: { soldAt: Between(start, end), status: SaleStatus.COMPLETED },
      relations: { station: true },
    });

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthSales = await this.salesRepo.find({
      where: {
        soldAt: Between(monthStart, end),
        status: SaleStatus.COMPLETED,
      },
      relations: { station: true },
    });

    const expenses = await this.expensesRepo.find({
      where: {
        expenseDate: Between(
          monthStart.toISOString().slice(0, 10),
          end.toISOString().slice(0, 10),
        ) as unknown as string,
        status: ExpenseStatus.APPROVED,
      },
    });

    const outstandingCredit = await this.customersRepo
      .createQueryBuilder('c')
      .select('COALESCE(SUM(c.outstanding_balance), 0)', 'total')
      .getRawOne<{ total: string }>();

    const cylindersWithCustomers = await this.cylindersRepo.count({
      where: { status: CylinderStatus.WITH_CUSTOMER },
    });
    const damagedCylinders = await this.cylindersRepo.count({
      where: { status: CylinderStatus.DAMAGED },
    });
    const openShifts = await this.shiftsRepo.count({
      where: { status: ShiftStatus.OPEN },
    });
    const unconfirmedTransfers = await this.transfersRepo.count({
      where: [
        { status: TransferStatus.IN_TRANSIT },
        { status: TransferStatus.DISPATCHED },
      ],
    });

    const topCustomers = await this.customersRepo.find({
      where: {},
      order: { outstandingBalance: 'DESC' },
      take: 8,
      relations: { station: true },
    });

    const pendingGmRequisitions = await this.requisitionsRepo.count({
      where: { status: RequisitionStatus.SUBMITTED },
    });
    const readyToPayRequisitions = await this.requisitionsRepo.count({
      where: { status: RequisitionStatus.READY_TO_PAY },
    });

    const byStation = stock.stations.map((station) => {
      const stationToday = todaySales.filter((s) => s.stationId === station.id);
      const stationMonth = monthSales.filter((s) => s.stationId === station.id);
      return {
        ...station,
        salesToday: round2(
          stationToday.reduce((sum, s) => sum + toNumber(s.totalAmount), 0),
        ),
        kgToday: round3(
          stationToday.reduce((sum, s) => sum + toNumber(s.lpgQuantityKg), 0),
        ),
        salesMonth: round2(
          stationMonth.reduce((sum, s) => sum + toNumber(s.totalAmount), 0),
        ),
        kgMonth: round3(
          stationMonth.reduce((sum, s) => sum + toNumber(s.lpgQuantityKg), 0),
        ),
        transactionsToday: stationToday.length,
      };
    });

    const ranked = [...byStation].sort((a, b) => b.salesToday - a.salesToday);

    return {
      totalLpgStockKg: stock.totalStockKg,
      totalCapacityKg: stock.totalCapacityKg,
      utilizationPercent: stock.utilizationPercent,
      salesToday: round2(
        todaySales.reduce((sum, s) => sum + toNumber(s.totalAmount), 0),
      ),
      kgSoldToday: round3(
        todaySales.reduce((sum, s) => sum + toNumber(s.lpgQuantityKg), 0),
      ),
      transactionsToday: todaySales.length,
      salesMonth: round2(
        monthSales.reduce((sum, s) => sum + toNumber(s.totalAmount), 0),
      ),
      kgSoldMonth: round3(
        monthSales.reduce((sum, s) => sum + toNumber(s.lpgQuantityKg), 0),
      ),
      expensesMonth: round2(
        expenses.reduce((sum, e) => sum + toNumber(e.amount), 0),
      ),
      outstandingCustomerBalances: round2(toNumber(outstandingCredit?.total)),
      cylindersWithCustomers,
      damagedCylinders,
      openShifts,
      unconfirmedTransfers,
      topStation: ranked[0] ?? null,
      lowestStation: ranked[ranked.length - 1] ?? null,
      stations: byStation,
      topCustomers: topCustomers
        .filter((c) => toNumber(c.outstandingBalance) > 0)
        .map((c) => ({
          id: c.id,
          customerCode: c.customerCode,
          fullName: c.fullName,
          outstandingBalance: toNumber(c.outstandingBalance),
          creditLimit: toNumber(c.creditLimit),
          stationCode: c.station?.code,
        })),
      requisitions: {
        pendingGmApproval: pendingGmRequisitions,
        readyToPay: readyToPayRequisitions,
      },
    };
  }
}
