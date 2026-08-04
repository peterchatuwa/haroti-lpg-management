import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CylinderStatus, WorkOrderStatus, WorkOrderType } from '../common/enums';
import { Cylinder } from '../cylinders/cylinder.entity';
import { Asset } from './asset.entity';
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
}
