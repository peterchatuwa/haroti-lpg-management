import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../audit/audit-log.entity';
import { AuditService } from '../audit/audit.service';
import { Station } from '../stations/station.entity';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { StockMovement } from './stock-movement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovement, Station, AuditLog])],
  controllers: [InventoryController],
  providers: [InventoryService, AuditService],
  exports: [InventoryService],
})
export class InventoryModule {}
