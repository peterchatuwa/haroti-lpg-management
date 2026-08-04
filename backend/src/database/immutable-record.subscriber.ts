import { ForbiddenException } from '@nestjs/common';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  RemoveEvent,
} from 'typeorm';
import { JournalEntry } from '../finance/journal-entry.entity';
import { StockMovement } from '../inventory/stock-movement.entity';
import { Sale } from '../sales/sale.entity';

const IMMUTABLE_ENTITIES = [Sale, JournalEntry, StockMovement];

@EventSubscriber()
export class ImmutableRecordSubscriber implements EntitySubscriberInterface {
  beforeRemove(event: RemoveEvent<object>) {
    if (
      IMMUTABLE_ENTITIES.some(
        (entity) => event.metadata.target === entity,
      )
    ) {
      throw new ForbiddenException(
        'Posted records cannot be deleted; use reversal or void workflow',
      );
    }
  }
}
