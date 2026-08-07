import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

@Entity('customer_otp_challenges')
export class CustomerOtpChallenge extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'varchar', length: 8 })
  code!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'attempts', type: 'int', default: 0 })
  attempts!: number;
}
