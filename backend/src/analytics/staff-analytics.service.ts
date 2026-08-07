import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { round2, round3, toNumber } from '../common/decimal';
import { SaleStatus, ShiftStatus } from '../common/enums';
import { LossCase } from '../tanks/loss-case.entity';
import { Sale } from '../sales/sale.entity';
import { Shift } from '../shifts/shift.entity';
import { User } from '../users/user.entity';
import { TargetsService } from '../targets/targets.service';

@Injectable()
export class StaffAnalyticsService {
  constructor(
    @InjectRepository(Sale) private readonly salesRepo: Repository<Sale>,
    @InjectRepository(Shift) private readonly shiftsRepo: Repository<Shift>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(LossCase) private readonly lossRepo: Repository<LossCase>,
    private readonly targetsService: TargetsService,
  ) {}

  private periodRange(periodStart?: string, periodEnd?: string) {
    const start = periodStart
      ? new Date(periodStart)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = periodEnd ? new Date(periodEnd) : new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  async attendantScorecards(params: {
    stationId?: string;
    periodStart?: string;
    periodEnd?: string;
  }) {
    const { start, end } = this.periodRange(params.periodStart, params.periodEnd);
    const sales = await this.salesRepo.find({
      where: {
        soldAt: Between(start, end),
        status: SaleStatus.COMPLETED,
        ...(params.stationId ? { stationId: params.stationId } : {}),
      },
      relations: { attendant: true, station: true },
    });

    const shifts = await this.shiftsRepo.find({
      where: {
        openedAt: Between(start, end),
        ...(params.stationId ? { stationId: params.stationId } : {}),
      },
    });

    const byAttendant: Record<
      string,
      {
        userId: string;
        fullName: string;
        stationCode?: string;
        revenue: number;
        kg: number;
        txnCount: number;
        discounts: number;
        voids: number;
        shiftHours: number;
      }
    > = {};

    for (const sale of sales) {
      const id = sale.attendantId;
      if (!byAttendant[id]) {
        byAttendant[id] = {
          userId: id,
          fullName: sale.attendant?.fullName ?? id,
          stationCode: sale.station?.code,
          revenue: 0,
          kg: 0,
          txnCount: 0,
          discounts: 0,
          voids: 0,
          shiftHours: 0,
        };
      }
      byAttendant[id].revenue += toNumber(sale.totalAmount);
      byAttendant[id].kg += toNumber(sale.lpgQuantityKg);
      byAttendant[id].txnCount += 1;
      byAttendant[id].discounts += toNumber(sale.discountAmount);
    }

    for (const shift of shifts) {
      if (!byAttendant[shift.attendantId]) continue;
      const closed = shift.closedAt ?? end;
      const hours =
        (closed.getTime() - shift.openedAt.getTime()) / (1000 * 60 * 60);
      byAttendant[shift.attendantId].shiftHours += Math.max(hours, 0);
    }

    const voidSales = await this.salesRepo.find({
      where: {
        soldAt: Between(start, end),
        status: SaleStatus.VOIDED,
        ...(params.stationId ? { stationId: params.stationId } : {}),
      },
    });
    for (const v of voidSales) {
      if (byAttendant[v.attendantId]) byAttendant[v.attendantId].voids += 1;
    }

    return Object.values(byAttendant)
      .map((a) => ({
        ...a,
        revenue: round2(a.revenue),
        kg: round3(a.kg),
        avgTicket: a.txnCount > 0 ? round2(a.revenue / a.txnCount) : 0,
        salesPerHour:
          a.shiftHours > 0 ? round2(a.revenue / a.shiftHours) : 0,
        discountRate:
          a.revenue > 0 ? round2((a.discounts / a.revenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  async managerScorecards(params: {
    stationId?: string;
    periodStart?: string;
    periodEnd?: string;
  }) {
    const { start, end } = this.periodRange(params.periodStart, params.periodEnd);
    const managers = await this.usersRepo.find({
      where: params.stationId ? { stationId: params.stationId } : {},
    });

    const targetProgress = await this.targetsService.progress();
    const openLoss = await this.lossRepo.count({
      where: {
        status: 'OPEN' as never,
        ...(params.stationId ? { stationId: params.stationId } : {}),
      },
    });

    const pendingShifts = await this.shiftsRepo.count({
      where: {
        status: ShiftStatus.PENDING_APPROVAL,
        ...(params.stationId ? { stationId: params.stationId } : {}),
      },
    });

    const stationTargets = params.stationId
      ? targetProgress.filter((t) => t.stationId === params.stationId)
      : targetProgress;

    const avgTargetPct =
      stationTargets.length > 0
        ? round2(
            stationTargets.reduce((s, t) => s + (t.achievementPct ?? 0), 0) /
              stationTargets.length,
          )
        : 0;

    return managers
      .filter((m) =>
        ['STATION_MANAGER', 'OPERATIONS_MANAGER', 'SYSTEM_ADMIN'].includes(
          m.role,
        ),
      )
      .map((m) => ({
        userId: m.id,
        fullName: m.fullName,
        role: m.role,
        stationId: m.stationId,
        targetAchievementPct: avgTargetPct,
        pendingShiftApprovals: pendingShifts,
        openLossCases: openLoss,
        periodStart: start.toISOString().slice(0, 10),
        periodEnd: end.toISOString().slice(0, 10),
      }));
  }

  async networkFlash() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const sales = await this.salesRepo.find({
      where: { soldAt: Between(start, new Date()), status: SaleStatus.COMPLETED },
      relations: { station: true },
    });

    const byStation: Record<
      string,
      { code: string; revenue: number; kg: number; txnCount: number }
    > = {};
    for (const sale of sales) {
      const id = sale.stationId;
      if (!byStation[id]) {
        byStation[id] = {
          code: sale.station?.code ?? id,
          revenue: 0,
          kg: 0,
          txnCount: 0,
        };
      }
      byStation[id].revenue += toNumber(sale.totalAmount);
      byStation[id].kg += toNumber(sale.lpgQuantityKg);
      byStation[id].txnCount += 1;
    }

    return Object.values(byStation)
      .map((s) => ({
        ...s,
        revenue: round2(s.revenue),
        kg: round3(s.kg),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }
}
