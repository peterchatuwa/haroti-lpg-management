import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyTxnType } from '../common/enums';
import { Customer } from '../customers/customer.entity';
import { LoyaltyAccount } from './loyalty-account.entity';
import { LoyaltyTransaction } from './loyalty-transaction.entity';

const POINTS_PER_1000_MWK = 1;

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyAccount)
    private readonly accountsRepo: Repository<LoyaltyAccount>,
    @InjectRepository(LoyaltyTransaction)
    private readonly txnsRepo: Repository<LoyaltyTransaction>,
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
  ) {}

  listAccounts() {
    return this.accountsRepo.find({
      relations: { customer: true },
      order: { pointsBalance: 'DESC' },
      take: 200,
    });
  }

  async getOrCreate(customerId: string) {
    let account = await this.accountsRepo.findOne({
      where: { customerId },
      relations: { customer: true },
    });
    if (!account) {
      account = await this.accountsRepo.save(
        this.accountsRepo.create({ customerId, pointsBalance: 0, lifetimeEarned: 0 }),
      );
      account = (await this.accountsRepo.findOne({
        where: { id: account.id },
        relations: { customer: true },
      }))!;
    }
    return account;
  }

  async earnFromSale(customerId: string, amountMwk: number, saleId: string) {
    const points = Math.floor(amountMwk / 1000) * POINTS_PER_1000_MWK;
    if (points <= 0) return null;
    return this.applyPoints(
      customerId,
      points,
      LoyaltyTxnType.EARN,
      `Sale reward`,
      'SALE',
      saleId,
    );
  }

  async redeem(customerId: string, points: number, description?: string) {
    const account = await this.getOrCreate(customerId);
    if (points <= 0) throw new BadRequestException('Points must be positive');
    if (account.pointsBalance < points) {
      throw new BadRequestException('Insufficient loyalty points');
    }
    return this.applyPoints(
      customerId,
      -points,
      LoyaltyTxnType.REDEEM,
      description ?? 'Points redeemed',
    );
  }

  async history(customerId: string) {
    const account = await this.getOrCreate(customerId);
    return this.txnsRepo.find({
      where: { accountId: account.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  private async applyPoints(
    customerId: string,
    delta: number,
    type: LoyaltyTxnType,
    description: string,
    referenceType?: string,
    referenceId?: string,
  ) {
    const customer = await this.customersRepo.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const account = await this.getOrCreate(customerId);
    account.pointsBalance += delta;
    if (delta > 0) account.lifetimeEarned += delta;
    await this.accountsRepo.save(account);

    return this.txnsRepo.save(
      this.txnsRepo.create({
        accountId: account.id,
        type,
        points: Math.abs(delta),
        balanceAfter: account.pointsBalance,
        description,
        referenceType,
        referenceId,
      }),
    );
  }
}
