import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, round2, toNumber } from '../common/decimal';
import { RequisitionStatus, UserRole } from '../common/enums';
import { FinanceService } from '../finance/finance.service';
import { CreateRequisitionDto } from './dto/create-requisition.dto';
import { RequisitionLine } from './requisition-line.entity';
import { Requisition } from './requisition.entity';

const GM_ROLES = new Set<UserRole>([
  UserRole.SYSTEM_ADMIN,
  UserRole.DIRECTOR,
  UserRole.OPERATIONS_MANAGER,
]);

const FINANCE_ROLES = new Set<UserRole>([
  UserRole.SYSTEM_ADMIN,
  UserRole.DIRECTOR,
  UserRole.FINANCE_MANAGER,
]);

const REQUESTER_ROLES = new Set<UserRole>([
  UserRole.STATION_MANAGER,
  UserRole.STOREKEEPER,
  UserRole.ATTENDANT,
  UserRole.OPERATIONS_MANAGER,
  UserRole.SYSTEM_ADMIN,
]);

@Injectable()
export class RequisitionsService {
  constructor(
    @InjectRepository(Requisition)
    private readonly reqRepo: Repository<Requisition>,
    @InjectRepository(RequisitionLine)
    private readonly lineRepo: Repository<RequisitionLine>,
    private readonly financeService: FinanceService,
  ) {}

  findAll(stationId?: string, status?: RequisitionStatus) {
    return this.reqRepo.find({
      where: {
        ...(stationId ? { stationId } : {}),
        ...(status ? { status } : {}),
      },
      relations: {
        station: true,
        requestedBy: true,
        gmApprovedBy: true,
        paidBy: true,
        lines: true,
      },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async pendingSummary() {
    const submitted = await this.reqRepo.count({
      where: { status: RequisitionStatus.SUBMITTED },
    });
    const readyToPay = await this.reqRepo.count({
      where: { status: RequisitionStatus.READY_TO_PAY },
    });
    return { pendingGmApproval: submitted, readyToPay };
  }

  async findOne(id: string) {
    const req = await this.reqRepo.findOne({
      where: { id },
      relations: {
        station: true,
        requestedBy: true,
        gmApprovedBy: true,
        paidBy: true,
        lines: true,
      },
    });
    if (!req) throw new NotFoundException('Requisition not found');
    return req;
  }

  async create(dto: CreateRequisitionDto, userId: string, role: UserRole) {
    if (!REQUESTER_ROLES.has(role)) {
      throw new ForbiddenException('Your role cannot create requisitions');
    }

    const total = round2(
      dto.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0),
    );
    if (total <= 0) {
      throw new BadRequestException(
        'Requisition total must be greater than zero',
      );
    }

    const lines = dto.lines.map((l) =>
      this.lineRepo.create({
        itemDescription: l.itemDescription,
        quantity: l.quantity,
        unitCost: asDecimal(l.unitCost, 2),
        lineTotal: asDecimal(round2(l.quantity * l.unitCost), 2),
      }),
    );

    const stamp = Date.now().toString().slice(-8);
    const requisition = this.reqRepo.create({
      requisitionNumber: `REQ-${stamp}`,
      stationId: dto.stationId,
      requestedById: userId,
      status: RequisitionStatus.SUBMITTED,
      category: dto.category,
      totalAmount: asDecimal(total, 2),
      notes: dto.notes,
      lines,
    });

    return this.reqRepo.save(requisition);
  }

  async approve(id: string, approverId: string, role: UserRole) {
    if (!GM_ROLES.has(role)) {
      throw new ForbiddenException(
        'Only GM / operations manager can approve requisitions',
      );
    }

    const req = await this.findOne(id);
    if (req.status !== RequisitionStatus.SUBMITTED) {
      throw new BadRequestException('Requisition is not awaiting GM approval');
    }
    if (req.requestedById === approverId) {
      throw new ForbiddenException('Cannot approve your own requisition');
    }

    req.status = RequisitionStatus.READY_TO_PAY;
    req.gmApprovedById = approverId;
    req.gmApprovedAt = new Date();
    return this.reqRepo.save(req);
  }

  async reject(
    id: string,
    approverId: string,
    role: UserRole,
    reason?: string,
  ) {
    if (!GM_ROLES.has(role)) {
      throw new ForbiddenException(
        'Only GM / operations manager can reject requisitions',
      );
    }

    const req = await this.findOne(id);
    if (req.status !== RequisitionStatus.SUBMITTED) {
      throw new BadRequestException('Requisition is not awaiting GM approval');
    }

    req.status = RequisitionStatus.REJECTED;
    req.gmApprovedById = approverId;
    req.rejectionReason = reason ?? 'Rejected by approver';
    return this.reqRepo.save(req);
  }

  async pay(
    id: string,
    payerId: string,
    role: UserRole,
    paymentReference?: string,
  ) {
    if (!FINANCE_ROLES.has(role)) {
      throw new ForbiddenException(
        'Only finance can mark requisitions as paid',
      );
    }

    const req = await this.findOne(id);
    if (req.status !== RequisitionStatus.READY_TO_PAY) {
      throw new BadRequestException(
        'Requisition must be GM-approved before finance can pay',
      );
    }

    const amount = toNumber(req.totalAmount);
    await this.financeService.postRequisitionPayment(
      amount,
      req.category,
      req.id,
    );

    req.status = RequisitionStatus.PAID;
    req.paidById = payerId;
    req.paidAt = new Date();
    req.paymentReference =
      paymentReference ?? `PAY-${Date.now().toString().slice(-8)}`;
    return this.reqRepo.save(req);
  }
}
