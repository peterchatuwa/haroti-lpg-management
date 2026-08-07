import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tank } from '../tanks/tank.entity';
import { IoTDevice } from './iot-device.entity';
import { IoTController } from './iot.controller';
import { IoTService } from './iot.service';
import { TelemetryReading } from './telemetry-reading.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IoTDevice, TelemetryReading, Tank])],
  controllers: [IoTController],
  providers: [IoTService],
  exports: [IoTService],
})
export class IoTModule {}
