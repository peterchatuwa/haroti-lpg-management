import { ForbiddenException } from '@nestjs/common';
import { Sale } from '../src/sales/sale.entity';
import { ImmutableRecordSubscriber } from '../src/database/immutable-record.subscriber';

describe('ImmutableRecordSubscriber (AC-10)', () => {
  const subscriber = new ImmutableRecordSubscriber();

  it('blocks deletion of posted sales', () => {
    expect(() =>
      subscriber.beforeRemove({
        metadata: { target: Sale },
      } as never),
    ).toThrow(ForbiddenException);
  });
});
