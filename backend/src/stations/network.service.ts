import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { round2, toNumber } from '../common/decimal';
import {
  ShiftStatus,
  StationHealthStatus,
  StationStatus,
} from '../common/enums';
import { Shift } from '../shifts/shift.entity';
import { TanksService } from '../tanks/tanks.service';
import { Station } from './station.entity';

/** Approximate Malawi station coordinates for network map. */
const DEFAULT_COORDS: Record<string, { lat: number; lng: number }> = {
  LLW01: { lat: -13.9626, lng: 33.7741 },
  LLW02: { lat: -13.95, lng: 33.79 },
  BT01: { lat: -15.7861, lng: 35.0058 },
  BT02: { lat: -15.8, lng: 35.02 },
  SAL01: { lat: -13.7804, lng: 34.4587 },
};

@Injectable()
export class NetworkService implements OnModuleInit {
  constructor(
    @InjectRepository(Station)
    private readonly stationsRepo: Repository<Station>,
    @InjectRepository(Shift)
    private readonly shiftsRepo: Repository<Shift>,
    private readonly tanksService: TanksService,
  ) {}

  async onModuleInit() {
    const stations = await this.stationsRepo.find();
    for (const s of stations) {
      if (s.latitude && s.longitude) continue;
      const coords = DEFAULT_COORDS[s.code];
      if (coords) {
        s.latitude = String(coords.lat);
        s.longitude = String(coords.lng);
        if (!s.reorderLevelKg) {
          s.reorderLevelKg = String(toNumber(s.tankCapacityKg) * 0.25);
        }
        if (!s.minStockKg) {
          s.minStockKg = String(toNumber(s.tankCapacityKg) * 0.1);
        }
        if (!s.safetyStockKg) {
          s.safetyStockKg = String(toNumber(s.tankCapacityKg) * 0.15);
        }
        await this.stationsRepo.save(s);
      }
    }
  }

  async mapOverview() {
    const stations = await this.stationsRepo.find({
      where: { status: StationStatus.ACTIVE },
    });
    const runout = await this.tanksService.runoutForecast();
    const runoutByStation = new Map(runout.map((r) => [r.stationId, r]));

    const openShifts = await this.shiftsRepo.find({
      where: { status: ShiftStatus.OPEN },
    });
    const openByStation = new Map<string, number>();
    for (const sh of openShifts) {
      openByStation.set(sh.stationId, (openByStation.get(sh.stationId) ?? 0) + 1);
    }

    return stations.map((s) => {
      const r = runoutByStation.get(s.id);
      const daysToRunout = r?.daysToRunout ?? 999;
      const stockPct =
        toNumber(s.tankCapacityKg) > 0
          ? round2(
              (toNumber(s.currentStockKg) / toNumber(s.tankCapacityKg)) * 100,
            )
          : 0;

      let health = StationHealthStatus.GREEN;
      if (daysToRunout <= 3 || stockPct < 10) {
        health = StationHealthStatus.RED;
      } else if (daysToRunout <= 7 || stockPct < 25) {
        health = StationHealthStatus.AMBER;
      }

      return {
        id: s.id,
        code: s.code,
        name: s.name,
        district: s.district,
        latitude: s.latitude ? Number(s.latitude) : null,
        longitude: s.longitude ? Number(s.longitude) : null,
        currentStockKg: toNumber(s.currentStockKg),
        tankCapacityKg: toNumber(s.tankCapacityKg),
        stockPct,
        daysToRunout,
        health,
        openShifts: openByStation.get(s.id) ?? 0,
        isFranchise: s.isFranchise,
      };
    });
  }
}
