import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { ComplianceItem } from './compliance-item.entity';
import { SafetyIncident } from './safety-incident.entity';
import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SafetyIncident, ComplianceItem]),
    NotificationsModule,
  ],
  controllers: [SafetyController],
  providers: [SafetyService],
  exports: [SafetyService],
})
export class SafetyModule {}
