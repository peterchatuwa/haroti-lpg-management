import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, toNumber } from '../common/decimal';
import { ExpenseStatus, UserRole, WorkflowEntityType } from '../common/enums';
import { FinanceService } from '../finance/finance.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WorkflowsService } from '../workflows/workflows.service';
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
    private readonly financeService: FinanceService,
    private readonly workflowsService: WorkflowsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll(stationId?: string) {
    return this.expensesRepo.find({
      where: stationId ? { stationId } : {},
      order: { createdAt: 'DESC' },
      relations: { station: true, createdBy: true },
      take: 100,
    });
  }

  async create(dto: CreateExpenseDto, userId: string) {
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
    const saved = await this.expensesRepo.save(expense);

    if (saved.status === ExpenseStatus.SUBMITTED) {
      await this.workflowsService.createTask({
        entityType: WorkflowEntityType.EXPENSE,
        entityId: saved.id,
        amount: dto.amount,
        requesterId: userId,
        stationId: dto.stationId,
        summary: `${dto.category}: ${dto.description}`,
      });
      await this.notificationsService.dispatch({
        eventType: 'expense.approval_required',
        title: 'Expense awaiting approval',
        body: `Expense MWK ${dto.amount.toFixed(0)} — ${dto.description}`,
        entityType: WorkflowEntityType.EXPENSE,
        entityId: saved.id,
        mandatory: true,
      });
    }

    if (saved.status === ExpenseStatus.APPROVED) {
      await this.financeService.postStationExpense(
        dto.amount,
        dto.category,
        saved.id,
      );
    }

    return saved;
  }

  async approve(id: string, approverId: string, approverRole: UserRole) {
    const allowed = [
      UserRole.STATION_MANAGER,
      UserRole.OPERATIONS_MANAGER,
      UserRole.FINANCE_MANAGER,
      UserRole.SYSTEM_ADMIN,
      UserRole.DIRECTOR,
    ];
    if (!allowed.includes(approverRole)) {
      throw new BadRequestException('Insufficient role to approve expenses');
    }

    const expense = await this.expensesRepo.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.status === ExpenseStatus.APPROVED) return expense;
    if (expense.status === ExpenseStatus.REJECTED) {
      throw new BadRequestException('Expense was rejected');
    }
    if (expense.createdById === approverId) {
      throw new BadRequestException('Cannot approve your own expense');
    }

    expense.status = ExpenseStatus.APPROVED;
    expense.approvedById = approverId;
    await this.expensesRepo.save(expense);

    await this.financeService.postStationExpense(
      toNumber(expense.amount),
      expense.category,
      expense.id,
    );

    return expense;
  }

  async reject(id: string, approverId: string) {
    const expense = await this.expensesRepo.findOne({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');
    expense.status = ExpenseStatus.REJECTED;
    expense.approvedById = approverId;
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
