import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CylinderStatus,
  WorkOrderStatus,
  WorkOrderType,
} from '../common/enums';
import { Cylinder } from '../cylinders/cylinder.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Asset } from './asset.entity';
import { MaintenancePlan } from './maintenance-plan.entity';
import { MaintenanceWorkOrder } from './work-order.entity';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceWorkOrder)
    private readonly woRepo: Repository<MaintenanceWorkOrder>,
    @InjectRepository(Cylinder)
    private readonly cylindersRepo: Repository<Cylinder>,
    @InjectRepository(Asset)
    private readonly assetsRepo: Repository<Asset>,
    @InjectRepository(MaintenancePlan)
    private readonly plansRepo: Repository<MaintenancePlan>,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll(status?: WorkOrderStatus) {
    return this.woRepo.find({
      where: status ? { status } : {},
      relations: { station: true, cylinder: true, assignedTo: true },
      order: { dueDate: 'ASC' },
      take: 100,
    });
  }

  listAssets(stationId?: string) {
    return this.assetsRepo.find({
      where: stationId ? { stationId } : {},
      relations: { station: true },
      order: { name: 'ASC' },
    });
  }

  async hydroTestDue() {
    const today = new Date().toISOString().slice(0, 10);
    return this.cylindersRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.station', 'station')
      .where('c.next_inspection_date <= :today', { today })
      .orderBy('c.next_inspection_date', 'ASC')
      .take(50)
      .getMany();
  }

  async createHydroTestOrders() {
    const due = await this.hydroTestDue();
    const created: MaintenanceWorkOrder[] = [];
    for (const cyl of due) {
      const existing = await this.woRepo.findOne({
        where: {
          cylinderId: cyl.id,
          type: WorkOrderType.CYLINDER_HYDRO_TEST,
          status: WorkOrderStatus.OPEN,
        },
      });
      if (existing) continue;
      const wo = await this.woRepo.save(
        this.woRepo.create({
          woNumber: `WO-HYD-${cyl.serialNumber}`,
          type: WorkOrderType.CYLINDER_HYDRO_TEST,
          title: `5-year hydro test — ${cyl.serialNumber}`,
          description: `Statutory cylinder hydro-testing due ${cyl.nextInspectionDate}`,
          stationId: cyl.stationId,
          cylinderId: cyl.id,
          dueDate: cyl.nextInspectionDate,
        }),
      );
      created.push(wo);
      void this.notificationsService.notifyHydroWorkOrder({
        serialNumber: cyl.serialNumber,
        stationCode: cyl.station?.code,
      });
    }
    return created;
  }

  async assign(id: string, userId: string) {
    const wo = await this.woRepo.findOne({ where: { id } });
    if (!wo) throw new NotFoundException('Work order not found');
    wo.assignedToId = userId;
    wo.status = WorkOrderStatus.IN_PROGRESS;
    return this.woRepo.save(wo);
  }

  async completeHydro(id: string, certificateRef?: string) {
    const wo = await this.woRepo.findOne({
      where: { id },
      relations: { cylinder: true },
    });
    if (!wo) throw new NotFoundException('Work order not found');

    wo.status = WorkOrderStatus.COMPLETED;
    wo.completedAt = new Date();
    if (certificateRef) wo.hydroCertificateRef = certificateRef;

    if (wo.cylinderId && wo.cylinder) {
      const cyl = wo.cylinder;
      const today = new Date().toISOString().slice(0, 10);
      cyl.lastInspectionDate = today;
      const next = new Date();
      next.setFullYear(next.getFullYear() + 5);
      cyl.nextInspectionDate = next.toISOString().slice(0, 10);
      cyl.status = CylinderStatus.AVAILABLE;
      await this.cylindersRepo.save(cyl);
    }

    return this.woRepo.save(wo);
  }

  async complete(id: string) {
    const wo = await this.woRepo.findOne({ where: { id } });
    if (!wo) return null;
    if (wo.type === WorkOrderType.CYLINDER_HYDRO_TEST) {
      return this.completeHydro(id);
    }
    wo.status = WorkOrderStatus.COMPLETED;
    wo.completedAt = new Date();
    return this.woRepo.save(wo);
  }

  listPlans(stationId?: string) {
    return this.plansRepo.find({
      where: stationId ? { stationId } : {},
      relations: { station: true, asset: true },
      order: { nextDueDate: 'ASC' },
    });
  }

  async createPlan(dto: {
    name: string;
    assetCategory: string;
    stationId?: string;
    assetId?: string;
    intervalDays: number;
    nextDueDate: string;
    description?: string;
  }) {
    return this.plansRepo.save(
      this.plansRepo.create({
        name: dto.name,
        assetCategory: dto.assetCategory as never,
        stationId: dto.stationId,
        assetId: dto.assetId,
        intervalDays: dto.intervalDays,
        nextDueDate: dto.nextDueDate,
        description: dto.description,
        isActive: true,
      }),
    );
  }

  async runDuePlans() {
    const today = new Date().toISOString().slice(0, 10);
    const due = await this.plansRepo.find({
      where: { isActive: true },
    });
    const created: MaintenanceWorkOrder[] = [];
    for (const plan of due.filter((p) => p.nextDueDate <= today)) {
      const wo = await this.woRepo.save(
        this.woRepo.create({
          woNumber: `WO-PM-${Date.now().toString().slice(-6)}`,
          type: WorkOrderType.STATION_EQUIPMENT,
          title: plan.name,
          description:
            plan.description ?? `Preventive maintenance: ${plan.name}`,
          stationId: plan.stationId,
          dueDate: plan.nextDueDate,
        }),
      );
      created.push(wo);
      const next = new Date(plan.nextDueDate);
      next.setDate(next.getDate() + plan.intervalDays);
      plan.lastRunDate = today;
      plan.nextDueDate = next.toISOString().slice(0, 10);
      await this.plansRepo.save(plan);
    }
    return created;
  }
}
