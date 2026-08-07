import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiscalPeriodStatus, JournalEventType } from '../common/enums';
import { GL_ACCOUNTS } from './gl-accounts';
import { FiscalPeriod } from './fiscal-period.entity';
import { PostingRule } from './posting-rule.entity';

@Injectable()
export class FiscalPeriodService implements OnModuleInit {
  constructor(
    @InjectRepository(FiscalPeriod)
    private readonly periodsRepo: Repository<FiscalPeriod>,
  ) {}

  async onModuleInit() {
    await this.ensureCurrentPeriod();
  }

  list() {
    return this.periodsRepo.find({ order: { year: 'DESC', period: 'DESC' } });
  }

  async assertOpenForPosting(date = new Date()) {
    const iso = date.toISOString().slice(0, 10);
    const period = await this.periodsRepo
      .createQueryBuilder('p')
      .where('p.start_date <= :iso AND p.end_date >= :iso', { iso })
      .getOne();

    if (period?.status === FiscalPeriodStatus.HARD_CLOSED) {
      throw new BadRequestException('Cannot post to a hard-closed fiscal period');
    }
  }

  async ensureCurrentPeriod() {
    const now = new Date();
    const year = now.getFullYear();
    const period = now.getMonth() + 1;
    const existing = await this.periodsRepo.findOne({ where: { year, period } });
    if (existing) return existing;

    const start = new Date(year, period - 1, 1);
    const end = new Date(year, period, 0);
    return this.periodsRepo.save(
      this.periodsRepo.create({
        year,
        period,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        status: FiscalPeriodStatus.OPEN,
      }),
    );
  }
}

const DEFAULT_RULES: Array<{
  eventType: JournalEventType;
  lineRole: string;
  account: (typeof GL_ACCOUNTS)[keyof typeof GL_ACCOUNTS];
  side: 'DEBIT' | 'CREDIT';
}> = [
  { eventType: JournalEventType.LPG_REFILL_SALE, lineRole: 'CASH', account: GL_ACCOUNTS.CASH, side: 'DEBIT' },
  { eventType: JournalEventType.LPG_REFILL_SALE, lineRole: 'REVENUE', account: GL_ACCOUNTS.REVENUE_LPG, side: 'CREDIT' },
  { eventType: JournalEventType.LPG_COGS, lineRole: 'COGS', account: GL_ACCOUNTS.COGS_LPG, side: 'DEBIT' },
  { eventType: JournalEventType.LPG_COGS, lineRole: 'INVENTORY', account: GL_ACCOUNTS.INVENTORY_BULK_LPG, side: 'CREDIT' },
  { eventType: JournalEventType.CUSTOMER_CREDIT_SALE, lineRole: 'AR', account: GL_ACCOUNTS.AR_CUSTOMER, side: 'DEBIT' },
  { eventType: JournalEventType.CUSTOMER_PAYMENT, lineRole: 'CASH', account: GL_ACCOUNTS.CASH, side: 'DEBIT' },
  { eventType: JournalEventType.CUSTOMER_PAYMENT, lineRole: 'AR', account: GL_ACCOUNTS.AR_CUSTOMER, side: 'CREDIT' },
  { eventType: JournalEventType.BUNDLE_SALE, lineRole: 'CASH', account: GL_ACCOUNTS.CASH, side: 'DEBIT' },
  { eventType: JournalEventType.BUNDLE_SALE, lineRole: 'REVENUE', account: GL_ACCOUNTS.REVENUE_BUNDLE, side: 'CREDIT' },
  { eventType: JournalEventType.AGENT_COMMISSION, lineRole: 'COMMISSION', account: GL_ACCOUNTS.COMMISSION_PAYABLE, side: 'CREDIT' },
  { eventType: JournalEventType.AGENT_COMMISSION, lineRole: 'COGS', account: GL_ACCOUNTS.COGS_ACCESSORY, side: 'DEBIT' },
];

@Injectable()
export class PostingRuleService implements OnModuleInit {
  constructor(
    @InjectRepository(PostingRule)
    private readonly rulesRepo: Repository<PostingRule>,
  ) {}

  async onModuleInit() {
    const count = await this.rulesRepo.count();
    if (count > 0) return;
    const effectiveFrom = '2026-01-01';
    await this.rulesRepo.save(
      DEFAULT_RULES.map((r) =>
        this.rulesRepo.create({
          eventType: r.eventType,
          lineRole: r.lineRole,
          accountCode: r.account.code,
          accountName: r.account.name,
          side: r.side,
          effectiveFrom,
          isActive: true,
          version: 1,
        }),
      ),
    );
  }

  list() {
    return this.rulesRepo.find({
      where: { isActive: true },
      order: { eventType: 'ASC', lineRole: 'ASC' },
    });
  }
}
