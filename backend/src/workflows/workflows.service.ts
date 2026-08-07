import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApprovalTaskStatus,
  UserRole,
  WorkflowEntityType,
} from '../common/enums';
import { ApprovalTask } from './approval-task.entity';
import { WorkflowDefinition } from './workflow-definition.entity';
import { WorkflowStep } from './workflow-step.entity';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(WorkflowDefinition)
    private readonly definitionsRepo: Repository<WorkflowDefinition>,
    @InjectRepository(WorkflowStep)
    private readonly stepsRepo: Repository<WorkflowStep>,
    @InjectRepository(ApprovalTask)
    private readonly tasksRepo: Repository<ApprovalTask>,
  ) {}

  listDefinitions() {
    return this.definitionsRepo.find({
      where: { isActive: true },
      relations: { steps: true },
      order: { entityType: 'ASC' },
    });
  }

  async createTask(params: {
    entityType: WorkflowEntityType;
    entityId: string;
    amount: number;
    requesterId: string;
    stationId?: string;
    summary?: string;
  }) {
    const definitions = await this.definitionsRepo.find({
      where: {
        entityType: params.entityType,
        isActive: true,
      },
      relations: { steps: true },
    });

    const definition = definitions
      .filter(
        (d) =>
          Number(d.minAmount) <= params.amount && (d.steps?.length ?? 0) > 0,
      )
      .sort((a, b) => Number(b.minAmount) - Number(a.minAmount))[0];

    if (!definition) {
      return null;
    }

    const steps = [...(definition.steps ?? [])].sort(
      (a, b) => a.stepOrder - b.stepOrder,
    );
    const first = steps[0];
    const dueAt = new Date();
    dueAt.setHours(dueAt.getHours() + first.escalationHours);

    const taskNumber = `AT-${Date.now().toString().slice(-8)}`;
    return this.tasksRepo.save(
      this.tasksRepo.create({
        taskNumber,
        subjectEntityType: params.entityType,
        subjectEntityId: params.entityId,
        amount: String(params.amount),
        status: ApprovalTaskStatus.PENDING,
        currentStep: first.stepOrder,
        assignedRole: first.approverRole,
        dueAt,
        requesterId: params.requesterId,
        stationId: params.stationId,
        summary: params.summary,
      }),
    );
  }

  inbox(role: UserRole, stationId?: string) {
    return this.tasksRepo.find({
      where: {
        assignedRole: role,
        status: ApprovalTaskStatus.PENDING,
        ...(stationId ? { stationId } : {}),
      },
      relations: { requester: true, station: true },
      order: { dueAt: 'ASC' },
    });
  }

  async approve(taskId: string, userId: string, role: UserRole) {
    const task = await this.getPendingTask(taskId, role);
    task.status = ApprovalTaskStatus.APPROVED;
    task.resolvedAt = new Date();
    task.resolvedById = userId;
    return this.tasksRepo.save(task);
  }

  async reject(taskId: string, userId: string, role: UserRole) {
    const task = await this.getPendingTask(taskId, role);
    task.status = ApprovalTaskStatus.REJECTED;
    task.resolvedAt = new Date();
    task.resolvedById = userId;
    return this.tasksRepo.save(task);
  }

  async escalateOverdue() {
    const now = new Date();
    const overdue = await this.tasksRepo.find({
      where: { status: ApprovalTaskStatus.PENDING },
      relations: { station: true },
    });

    let escalated = 0;
    for (const task of overdue) {
      if (task.dueAt > now) continue;

      const definition = await this.definitionsRepo.findOne({
        where: { entityType: task.subjectEntityType, isActive: true },
        relations: { steps: true },
      });
      if (!definition?.steps?.length) continue;

      const steps = [...definition.steps].sort((a, b) => a.stepOrder - b.stepOrder);
      const current = steps.find((s) => s.stepOrder === task.currentStep);
      const next =
        steps.find((s) => s.stepOrder > task.currentStep) ??
        (current?.fallbackRole
          ? { ...current, approverRole: current.fallbackRole, stepOrder: task.currentStep + 1, escalationHours: current.escalationHours }
          : null);

      if (!next) {
        task.status = ApprovalTaskStatus.EXPIRED;
        await this.tasksRepo.save(task);
        continue;
      }

      const dueAt = new Date();
      dueAt.setHours(dueAt.getHours() + (current?.escalationHours ?? 24));
      task.currentStep = next.stepOrder;
      task.assignedRole = next.approverRole;
      task.status = ApprovalTaskStatus.ESCALATED;
      task.dueAt = dueAt;
      await this.tasksRepo.save(task);
      task.status = ApprovalTaskStatus.PENDING;
      await this.tasksRepo.save(task);
      escalated += 1;
    }
    return { escalated };
  }

  pendingCount(role?: UserRole) {
    return this.tasksRepo.count({
      where: {
        status: ApprovalTaskStatus.PENDING,
        ...(role ? { assignedRole: role } : {}),
      },
    });
  }

  private async getPendingTask(taskId: string, role: UserRole) {
    const task = await this.tasksRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Approval task not found');
    if (task.status !== ApprovalTaskStatus.PENDING) {
      throw new BadRequestException('Task is not pending');
    }
    if (task.assignedRole !== role) {
      throw new BadRequestException('Not assigned to your role');
    }
    return task;
  }
}
