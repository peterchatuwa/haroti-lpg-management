import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseStatus, PurchaseOrderStatus, RequisitionStatus, SaleStatus, ShiftStatus } from '../common/enums';
import { Expense } from '../expenses/expense.entity';
import { PurchaseOrder } from '../procurement/purchase-order.entity';
import { Requisition } from '../requisitions/requisition.entity';
import { Sale } from '../sales/sale.entity';
import { Shift } from '../shifts/shift.entity';
import { LossCase } from '../tanks/loss-case.entity';
import { MaintenanceWorkOrder } from '../maintenance/work-order.entity';
import { WorkOrderStatus } from '../common/enums';

@Injectable()
export class ActionCentreService {
  constructor(
    @InjectRepository(Sale) private readonly salesRepo: Repository<Sale>,
    @InjectRepository(Shift) private readonly shiftsRepo: Repository<Shift>,
    @InjectRepository(Expense) private readonly expensesRepo: Repository<Expense>,
    @InjectRepository(Requisition) private readonly reqRepo: Repository<Requisition>,
    @InjectRepository(PurchaseOrder) private readonly poRepo: Repository<PurchaseOrder>,
    @InjectRepository(LossCase) private readonly lossRepo: Repository<LossCase>,
    @InjectRepository(MaintenanceWorkOrder) private readonly woRepo: Repository<MaintenanceWorkOrder>,
  ) {}

  async summary(stationId?: string) {
    const pendingDiscounts = await this.salesRepo.count({
      where: {
        status: SaleStatus.PENDING_APPROVAL,
        ...(stationId ? { stationId } : {}),
      },
    });

    const pendingShifts = await this.shiftsRepo.count({
      where: {
        status: ShiftStatus.PENDING_APPROVAL,
        ...(stationId ? { stationId } : {}),
      },
    });

    const pendingExpenses = await this.expensesRepo.count({
      where: {
        status: ExpenseStatus.SUBMITTED,
        ...(stationId ? { stationId } : {}),
      },
    });

    const pendingRequisitions = await this.reqRepo.count({
      where: {
        status: RequisitionStatus.SUBMITTED,
        ...(stationId ? { stationId } : {}),
      },
    });

    const pendingPo = await this.poRepo.count({
      where: { status: PurchaseOrderStatus.PENDING_APPROVAL },
    });

    const openLossCases = await this.lossRepo.count({
      where: {
        status: 'OPEN' as never,
        ...(stationId ? { stationId } : {}),
      },
    });

    const hydroOrders = await this.woRepo.count({
      where: { status: WorkOrderStatus.OPEN, type: 'CYLINDER_HYDRO_TEST' as never },
    });

    const items = [
      { type: 'DISCOUNT_APPROVAL', count: pendingDiscounts, label: 'Pending discount approvals' },
      { type: 'SHIFT_APPROVAL', count: pendingShifts, label: 'Shifts awaiting approval' },
      { type: 'EXPENSE_APPROVAL', count: pendingExpenses, label: 'Expenses to approve' },
      { type: 'REQUISITION', count: pendingRequisitions, label: 'Requisitions pending GM' },
      { type: 'PROCUREMENT', count: pendingPo, label: 'POs pending approval' },
      { type: 'LOSS_CASE', count: openLossCases, label: 'Open gas loss cases' },
      { type: 'HYDRO', count: hydroOrders, label: 'Hydro work orders open' },
    ].filter((i) => i.count > 0);

    return {
      total: items.reduce((s, i) => s + i.count, 0),
      items,
    };
  }
}
