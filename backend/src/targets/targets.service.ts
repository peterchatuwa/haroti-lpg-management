import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { asDecimal, round2, round3, toNumber } from '../common/decimal';
import {
  SaleStatus,
  TargetMetric,
  TargetPeriod,
  TargetScope,
} from '../common/enums';
import { Sale } from '../sales/sale.entity';
import { CreateTargetDto } from './dto/create-target.dto';
import { Target } from './target.entity';

@Injectable()
export class TargetsService {
  constructor(
    @InjectRepository(Target)
    private readonly targetsRepo: Repository<Target>,
    @InjectRepository(Sale)
    private readonly salesRepo: Repository<Sale>,
  ) {}

  list(stationId?: string) {
    const where = stationId ? [{ scope: TargetScope.STATION, stationId }] : {};
    return this.targetsRepo.find({
      where,
      relations: { station: true },
      order: { year: 'DESC', period: 'DESC' },
      take: 200,
    });
  }

  async create(dto: CreateTargetDto) {
    if (dto.scope === TargetScope.STATION && !dto.stationId) {
      throw new BadRequestException('stationId required for station targets');
    }
    return this.targetsRepo.save(
      this.targetsRepo.create({
        scope: dto.scope,
        stationId: dto.stationId,
        metric: dto.metric,
        periodType: dto.periodType,
        year: dto.year,
        period: dto.period,
        targetValue: asDecimal(dto.targetValue, 2),
        notes: dto.notes,
      }),
    );
  }

  async update(id: string, targetValue: number) {
    const target = await this.targetsRepo.findOne({ where: { id } });
    if (!target) throw new NotFoundException('Target not found');
    target.targetValue = asDecimal(targetValue, 2);
    return this.targetsRepo.save(target);
  }

  private periodRange(target: Target): { start: Date; end: Date } {
    const { year, period, periodType } = target;
    if (periodType === TargetPeriod.MONTH) {
      const start = new Date(year, period - 1, 1);
      const end = new Date(year, period, 0, 23, 59, 59, 999);
      return { start, end };
    }
    if (periodType === TargetPeriod.DAY) {
      const start = new Date(year, 0, period);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    const start = new Date(year, 0, 1 + (period - 1) * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private async actualForTarget(target: Target) {
    const { start, end } = this.periodRange(target);
    const qb = this.salesRepo
      .createQueryBuilder('s')
      .where('s.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('s.sold_at BETWEEN :start AND :end', { start, end });

    if (target.scope === TargetScope.STATION && target.stationId) {
      qb.andWhere('s.station_id = :stationId', {
        stationId: target.stationId,
      });
    }

    const sales = await qb.getMany();
    const revenue = sales.reduce((s, x) => s + toNumber(x.totalAmount), 0);
    const kg = sales.reduce((s, x) => s + toNumber(x.lpgQuantityKg), 0);
    const margin = revenue - kg * 1200;

    switch (target.metric) {
      case TargetMetric.KG:
        return round3(kg);
      case TargetMetric.MARGIN:
        return round2(margin);
      default:
        return round2(revenue);
    }
  }

  async progress(stationId?: string) {
    const now = new Date();
    const targets = await this.targetsRepo.find({
      where: stationId
        ? {
            stationId,
            periodType: TargetPeriod.MONTH,
            year: now.getFullYear(),
            period: now.getMonth() + 1,
          }
        : {
            periodType: TargetPeriod.MONTH,
            year: now.getFullYear(),
            period: now.getMonth() + 1,
          },
      relations: { station: true },
    });

    const rows = [];
    for (const target of targets) {
      const actual = await this.actualForTarget(target);
      const goal = toNumber(target.targetValue);
      rows.push({
        id: target.id,
        scope: target.scope,
        stationId: target.stationId,
        stationCode: target.station?.code,
        metric: target.metric,
        periodType: target.periodType,
        year: target.year,
        period: target.period,
        target: goal,
        actual,
        variance: round2(actual - goal),
        achievementPct: goal > 0 ? round2((actual / goal) * 100) : 0,
      });
    }
    return rows;
  }
}
