import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal } from '../common/decimal';
import { ExpenseStatus } from '../common/enums';
import { CashDeposit } from '../banking/cash-deposit.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { Expense } from './expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepo: Repository<Expense>,
    @InjectRepository(CashDeposit)
    private readonly depositsRepo: Repository<CashDeposit>,
  ) {}

  findAll(stationId?: string) {
    return this.expensesRepo.find({
      where: stationId ? { stationId } : {},
      order: { createdAt: 'DESC' },
      relations: { station: true, createdBy: true },
      take: 100,
    });
  }

  create(dto: CreateExpenseDto, userId: string) {
    const expense = this.expensesRepo.create({
      stationId: dto.stationId,
      category: dto.category,
      description: dto.description,
      amount: asDecimal(dto.amount, 2),
      expenseDate: dto.expenseDate,
      paymentMethod: dto.paymentMethod ?? 'CASH',
      receiptReference: dto.receiptReference,
      shiftId: dto.shiftId,
      createdById: userId,
      status:
        dto.amount > 50000 ? ExpenseStatus.SUBMITTED : ExpenseStatus.APPROVED,
    });
    return this.expensesRepo.save(expense);
  }

  async createDeposit(params: {
    stationId: string;
    depositDate: string;
    amount: number;
    bankName?: string;
    slipNumber?: string;
    collectionAgent?: string;
    shiftId?: string;
    notes?: string;
    userId: string;
  }) {
    const deposit = this.depositsRepo.create({
      stationId: params.stationId,
      depositDate: params.depositDate,
      amount: asDecimal(params.amount, 2),
      bankName: params.bankName,
      slipNumber: params.slipNumber,
      collectionAgent: params.collectionAgent,
      shiftId: params.shiftId,
      notes: params.notes,
      createdById: params.userId,
    });
    return this.depositsRepo.save(deposit);
  }

  listDeposits(stationId?: string) {
    return this.depositsRepo.find({
      where: stationId ? { stationId } : {},
      order: { createdAt: 'DESC' },
      relations: { station: true },
      take: 100,
    });
  }
}
