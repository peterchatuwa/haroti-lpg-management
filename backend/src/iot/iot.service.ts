import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IoTDeviceStatus } from '../common/enums';
import { Tank } from '../tanks/tank.entity';
import { IoTDevice } from './iot-device.entity';
import { TelemetryReading } from './telemetry-reading.entity';

@Injectable()
export class IoTService {
  constructor(
    @InjectRepository(IoTDevice)
    private readonly devicesRepo: Repository<IoTDevice>,
    @InjectRepository(TelemetryReading)
    private readonly readingsRepo: Repository<TelemetryReading>,
    @InjectRepository(Tank)
    private readonly tanksRepo: Repository<Tank>,
  ) {}

  listDevices(stationId?: string) {
    return this.devicesRepo.find({
      where: stationId ? { stationId } : {},
      relations: { station: true, tank: true },
      order: { name: 'ASC' },
    });
  }

  async ingestTelemetry(params: {
    deviceKey: string;
    levelKg?: number;
    pressureBar?: number;
    temperatureC?: number;
    recordedAt?: string;
    raw?: Record<string, unknown>;
  }) {
    const device = await this.devicesRepo.findOne({
      where: { deviceKey: params.deviceKey, status: IoTDeviceStatus.ACTIVE },
    });
    if (!device) {
      throw new BadRequestException('Unknown or inactive device');
    }

    device.lastSeenAt = new Date();
    await this.devicesRepo.save(device);

    const reading = await this.readingsRepo.save(
      this.readingsRepo.create({
        deviceId: device.id,
        levelKg: params.levelKg != null ? String(params.levelKg) : null,
        pressureBar:
          params.pressureBar != null ? String(params.pressureBar) : null,
        temperatureC:
          params.temperatureC != null ? String(params.temperatureC) : null,
        rawPayload: params.raw ?? null,
        recordedAt: params.recordedAt
          ? new Date(params.recordedAt)
          : new Date(),
      }),
    );

    if (device.tankId && params.levelKg != null) {
      const tank = await this.tanksRepo.findOne({
        where: { id: device.tankId },
      });
      if (tank) {
        tank.currentStockKg = String(params.levelKg);
        await this.tanksRepo.save(tank);
      }
    }

    return reading;
  }

  async tankTelemetry(tankId: string, limit = 50) {
    const tank = await this.tanksRepo.findOne({ where: { id: tankId } });
    if (!tank) throw new NotFoundException('Tank not found');

    const devices = await this.devicesRepo.find({ where: { tankId } });
    if (!devices.length) return [];

    return this.readingsRepo.find({
      where: devices.map((d) => ({ deviceId: d.id })),
      order: { recordedAt: 'DESC' },
      take: limit,
    });
  }
}
