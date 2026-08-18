import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, round2, toNumber } from '../common/decimal';
import { JournalEventType, ProjectStatus } from '../common/enums';
import { FinanceService, GL_ACCOUNTS } from '../finance/finance.service';
import { CapitalProject } from './capital-project.entity';
import { CreateExpenditureDto } from './dto/create-expenditure.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectExpenditure } from './project-expenditure.entity';
import { ProjectMilestone } from './project-milestone.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(CapitalProject)
    private readonly projectsRepo: Repository<CapitalProject>,
    @InjectRepository(ProjectMilestone)
    private readonly milestonesRepo: Repository<ProjectMilestone>,
    @InjectRepository(ProjectExpenditure)
    private readonly expendituresRepo: Repository<ProjectExpenditure>,
    private readonly financeService: FinanceService,
  ) {}

  findAll() {
    return this.projectsRepo.find({
      relations: { station: true, milestones: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const project = await this.projectsRepo.findOne({
      where: { id },
      relations: { station: true, milestones: true, expenditures: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(dto: CreateProjectDto) {
    const { milestones, ...rest } = dto;
    const code = rest.projectCode ?? `CAP-${Date.now().toString().slice(-6)}`;
    const project = this.projectsRepo.create({
      ...rest,
      projectCode: code,
      approvedBudget: asDecimal(rest.approvedBudget, 2),
      spentToDate: asDecimal(0, 2),
    });
    const saved = await this.projectsRepo.save(project);
    if (milestones?.length) {
      await this.milestonesRepo.save(
        milestones.map((m) =>
          this.milestonesRepo.create({
            projectId: saved.id,
            name: m.name,
            dueDate: m.dueDate,
            budgetAllocation: asDecimal(m.budgetAllocation, 2),
          }),
        ),
      );
    }
    return this.findOne(saved.id);
  }

  async addExpenditure(projectId: string, dto: CreateExpenditureDto) {
    const project = await this.findOne(projectId);
    const exp = await this.expendituresRepo.save(
      this.expendituresRepo.create({
        projectId,
        description: dto.description,
        amount: asDecimal(dto.amount, 2),
        expenseDate: dto.expenseDate,
        vendorName: dto.vendorName,
        isCwip: dto.isCwip ?? true,
      }),
    );

    project.spentToDate = asDecimal(
      toNumber(project.spentToDate) + dto.amount,
      2,
    );
    if (toNumber(project.spentToDate) > toNumber(project.approvedBudget)) {
      throw new BadRequestException('Expenditure exceeds approved budget');
    }
    await this.projectsRepo.save(project);

    await this.financeService.postEntry({
      eventType: JournalEventType.CAPITAL_EXPENDITURE,
      description: `CAPEX ${project.projectCode}: ${dto.description}`,
      referenceType: 'CapitalProject',
      referenceId: project.id,
      lines: [
        { account: GL_ACCOUNTS.CWIP, debit: dto.amount },
        { account: GL_ACCOUNTS.CASH, credit: dto.amount },
      ],
    });

    return exp;
  }

  async completeMilestone(milestoneId: string) {
    const ms = await this.milestonesRepo.findOne({
      where: { id: milestoneId },
    });
    if (!ms) throw new NotFoundException('Milestone not found');
    ms.isCompleted = true;
    return this.milestonesRepo.save(ms);
  }

  async portfolioSummary() {
    const projects = await this.findAll();
    return {
      totalProjects: projects.length,
      active: projects.filter((p) => p.status === ProjectStatus.IN_PROGRESS)
        .length,
      totalBudget: round2(
        projects.reduce((s, p) => s + toNumber(p.approvedBudget), 0),
      ),
      totalSpent: round2(
        projects.reduce((s, p) => s + toNumber(p.spentToDate), 0),
      ),
      projects: projects.map((p) => ({
        id: p.id,
        projectCode: p.projectCode,
        name: p.name,
        type: p.type,
        status: p.status,
        approvedBudget: toNumber(p.approvedBudget),
        spentToDate: toNumber(p.spentToDate),
        utilizationPercent:
          toNumber(p.approvedBudget) > 0
            ? round2(
                (toNumber(p.spentToDate) / toNumber(p.approvedBudget)) * 100,
              )
            : 0,
        grantReference: p.grantReference,
        station: p.station?.code,
      })),
    };
  }
}
