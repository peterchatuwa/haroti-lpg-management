import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { round2, round3, toNumber, asDecimal } from '../common/decimal';
import { ExpenseStatus, SaleStatus, ShiftStatus } from '../common/enums';
import { Expense } from '../expenses/expense.entity';
import { Sale } from '../sales/sale.entity';
import { Shift } from '../shifts/shift.entity';
import { Tank } from '../tanks/tank.entity';
import { Station } from './station.entity';

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station)
    private readonly stationsRepo: Repository<Station>,
    @InjectRepository(Sale)
    private readonly salesRepo: Repository<Sale>,
    @InjectRepository(Shift)
    private readonly shiftsRepo: Repository<Shift>,
    @InjectRepository(Expense)
    private readonly expensesRepo: Repository<Expense>,
    @InjectRepository(Tank)
    private readonly tanksRepo: Repository<Tank>,
  ) {}

  findAll() {
    return this.stationsRepo.find({ order: { code: 'ASC' } });
  }

  async findOne(id: string) {
    const station = await this.stationsRepo.findOne({ where: { id } });
    if (!station) {
      throw new NotFoundException('Station not found');
    }
    return station;
  }

  async getStockSummary() {
    const stations = await this.findAll();
    const totalStockKg = stations.reduce(
      (sum, s) => sum + toNumber(s.currentStockKg),
      0,
    );
    const totalCapacityKg = stations.reduce(
      (sum, s) => sum + toNumber(s.tankCapacityKg),
      0,
    );
    return {
      totalStockKg,
      totalCapacityKg,
      utilizationPercent:
        totalCapacityKg > 0
          ? Math.round((totalStockKg / totalCapacityKg) * 1000) / 10
          : 0,
      stations: stations.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        district: s.district,
        currentStockKg: toNumber(s.currentStockKg),
        tankCapacityKg: toNumber(s.tankCapacityKg),
        status: s.status,
        lastSyncedAt: s.lastSyncedAt,
      })),
    };
  }

  async overview(id: string) {
    const station = await this.findOne(id);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const todaySales = await this.salesRepo.find({
      where: {
        stationId: id,
        soldAt: Between(start, end),
        status: SaleStatus.COMPLETED,
      },
      order: { soldAt: 'DESC' },
      take: 20,
    });

    const monthSales = await this.salesRepo.find({
      where: {
        stationId: id,
        soldAt: Between(monthStart, end),
        status: SaleStatus.COMPLETED,
      },
    });

    const openShifts = await this.shiftsRepo.count({
      where: { stationId: id, status: ShiftStatus.OPEN },
    });

    const recentShifts = await this.shiftsRepo.find({
      where: { stationId: id },
      order: { openedAt: 'DESC' },
      take: 5,
      relations: { attendant: true },
    });

    const monthExpenses = await this.expensesRepo.find({
      where: {
        stationId: id,
        status: ExpenseStatus.APPROVED,
      },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const tanks = await this.tanksRepo.find({
      where: { stationId: id, isActive: true },
    });

    const fillPercent =
      toNumber(station.tankCapacityKg) > 0
        ? Math.round(
            (toNumber(station.currentStockKg) /
              toNumber(station.tankCapacityKg)) *
              100,
          )
        : 0;

    return {
      station: {
        id: station.id,
        code: station.code,
        name: station.name,
        district: station.district,
        address: station.address,
        managerName: station.managerName,
        status: station.status,
        tankCapacityKg: toNumber(station.tankCapacityKg),
        currentStockKg: toNumber(station.currentStockKg),
        fillPercent,
        commercialStream: station.commercialStream,
        lastSyncedAt: station.lastSyncedAt,
      },
      today: {
        salesTotal: round2(
          todaySales.reduce((s, x) => s + toNumber(x.totalAmount), 0),
        ),
        kgSold: round3(
          todaySales.reduce((s, x) => s + toNumber(x.lpgQuantityKg), 0),
        ),
        transactions: todaySales.length,
      },
      month: {
        salesTotal: round2(
          monthSales.reduce((s, x) => s + toNumber(x.totalAmount), 0),
        ),
        kgSold: round3(
          monthSales.reduce((s, x) => s + toNumber(x.lpgQuantityKg), 0),
        ),
        transactions: monthSales.length,
        expensesTotal: round2(
          monthExpenses.reduce((s, e) => s + toNumber(e.amount), 0),
        ),
      },
      openShifts,
      tanks: tanks.map((t) => ({
        code: t.tankCode,
        name: t.name,
        capacityKg: toNumber(t.capacityKg),
        currentStockKg: toNumber(t.currentStockKg),
      })),
      recentSales: todaySales.slice(0, 10).map((s) => ({
        id: s.id,
        receiptNumber: s.receiptNumber,
        soldAt: s.soldAt,
        totalAmount: toNumber(s.totalAmount),
        lpgQuantityKg: toNumber(s.lpgQuantityKg),
      })),
      recentShifts: recentShifts.map((sh) => ({
        id: sh.id,
        status: sh.status,
        openedAt: sh.openedAt,
        closedAt: sh.closedAt,
        attendant: sh.attendant?.fullName,
        cashVariance: sh.cashVariance ? toNumber(sh.cashVariance) : null,
      })),
      recentExpenses: monthExpenses.map((e) => ({
        id: e.id,
        category: e.category,
        amount: toNumber(e.amount),
        status: e.status,
        expenseDate: e.expenseDate,
      })),
    };
  }

  async touchSync(stationId: string) {
    await this.stationsRepo.update(stationId, { lastSyncedAt: new Date() });
  }

  async updateWeightedAvgCost(
    stationId: string,
    qtyReceived: number,
    landedPerKg: number,
  ) {
    const station = await this.findOne(stationId);
    const oldStock = toNumber(station.currentStockKg) - qtyReceived;
    const oldWac = toNumber(station.weightedAvgCostPerKg ?? 1200);
    const newStock = toNumber(station.currentStockKg);
    const newWac =
      newStock > 0
        ? round2(
            (Math.max(0, oldStock) * oldWac + qtyReceived * landedPerKg) /
              newStock,
          )
        : landedPerKg;
    await this.stationsRepo.update(stationId, {
      weightedAvgCostPerKg: asDecimal(newWac, 2),
    });
    return newWac;
  }
}
