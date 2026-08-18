import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

@Entity('paychangu_webhooks')
export class PaychanguWebhook extends BaseEntity {
  @Column({ name: 'event_type', length: 60 })
  eventType!: string;

  @Column({ name: 'transaction_ref' })
  transactionRef!: string;

  @Column({ name: 'payload', type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ default: false })
  processed!: boolean;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt?: Date;

  @Column({ name: 'error_message', nullable: true })
  errorMessage?: string;
}
