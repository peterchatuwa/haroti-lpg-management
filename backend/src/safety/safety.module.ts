import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceItem } from './compliance-item.entity';
import { SafetyIncident } from './safety-incident.entity';
import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';

@Module({
  imports: [TypeOrmModule.forFeature([SafetyIncident, ComplianceItem])],
  controllers: [SafetyController],
  providers: [SafetyService],
  exports: [SafetyService],
})
export class SafetyModule {}
