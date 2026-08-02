import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, toNumber } from '../common/decimal';
import {
  StockMovementType,
  TransferItemType,
  TransferStatus,
} from '../common/enums';
import { InventoryService } from '../inventory/inventory.service';
import { StationsService } from '../stations/stations.service';
import {
  CreateTransferDto,
  ReceiveTransferDto,
} from './dto/create-transfer.dto';
import { TransferItem } from './transfer-item.entity';
import { Transfer } from './transfer.entity';

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(Transfer)
    private readonly transfersRepo: Repository<Transfer>,
    private readonly inventoryService: InventoryService,
    private readonly stationsService: StationsService,
  ) {}

  findAll() {
    return this.transfersRepo.find({
      order: { createdAt: 'DESC' },
      relations: { sourceStation: true, destinationStation: true, items: true },
      take: 100,
    });
  }

  async create(dto: CreateTransferDto, userId: string) {
    if (dto.sourceStationId === dto.destinationStationId) {
      throw new BadRequestException('Source and destination must differ');
    }
    const source = await this.stationsService.findOne(dto.sourceStationId);
    const stamp = Date.now().toString().slice(-8);
    const transfer = this.transfersRepo.create({
      transferNumber: `TRF-${source.code}-${stamp}`,
      sourceStationId: dto.sourceStationId,
      destinationStationId: dto.destinationStationId,
      status: TransferStatus.DISPATCHED,
      notes: dto.notes,
      requestedById: userId,
      approvedById: userId,
      dispatchedAt: new Date(),
      items: dto.items.map((item) =>
        Object.assign(new TransferItem(), {
          itemType: item.itemType,
          description: item.description,
          quantityDispatched: asDecimal(item.quantityDispatched),
          cylinderSerial: item.cylinderSerial,
          unit: item.unit ?? (item.itemType === TransferItemType.LPG ? 'kg' : 'ea'),
        }),
      ),
    });

    const saved = await this.transfersRepo.save(transfer);

    for (const item of saved.items) {
      if (item.itemType === TransferItemType.LPG) {
        await this.inventoryService.applyMovement({
          stationId: dto.sourceStationId,
          type: StockMovementType.TRANSFER_OUT,
          quantityKg: -toNumber(item.quantityDispatched),
          reason: `Transfer ${saved.transferNumber}`,
          referenceType: 'Transfer',
          referenceId: saved.id,
          userId,
        });
      }
    }

    saved.status = TransferStatus.IN_TRANSIT;
    return this.transfersRepo.save(saved);
  }

  async receive(id: string, dto: ReceiveTransferDto, userId: string) {
    const transfer = await this.transfersRepo.findOne({
      where: { id },
      relations: { items: true },
    });
    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }
    if (
      ![TransferStatus.IN_TRANSIT, TransferStatus.DISPATCHED].includes(
        transfer.status,
      )
    ) {
      throw new BadRequestException('Transfer cannot be received in current status');
    }

    for (const received of dto.items) {
      const item = transfer.items.find((i) => i.id === received.itemId);
      if (!item) {
        throw new BadRequestException(`Unknown transfer item ${received.itemId}`);
      }
      item.quantityReceived = asDecimal(received.quantityReceived);
      if (item.itemType === TransferItemType.LPG) {
        await this.inventoryService.applyMovement({
          stationId: transfer.destinationStationId,
          type: StockMovementType.TRANSFER_IN,
          quantityKg: received.quantityReceived,
          reason: `Transfer receipt ${transfer.transferNumber}`,
          referenceType: 'Transfer',
          referenceId: transfer.id,
          userId,
        });
      }
    }

    transfer.status = TransferStatus.CONFIRMED;
    transfer.receivedAt = new Date();
    return this.transfersRepo.save(transfer);
  }
}
