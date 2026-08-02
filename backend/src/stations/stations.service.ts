import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toNumber } from '../common/decimal';
import { Station } from './station.entity';

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station)
    private readonly stationsRepo: Repository<Station>,
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

  async touchSync(stationId: string) {
    await this.stationsRepo.update(stationId, { lastSyncedAt: new Date() });
  }
}
