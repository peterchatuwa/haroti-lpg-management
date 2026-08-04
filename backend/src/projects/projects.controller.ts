import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { CreateExpenditureDto } from './dto/create-expenditure.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get('portfolio')
  portfolio() {
    return this.projectsService.portfolioSummary();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  @Roles(
    UserRole.DIRECTOR,
    UserRole.FINANCE_MANAGER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SYSTEM_ADMIN,
  )
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Post(':id/expenditures')
  @Roles(
    UserRole.FINANCE_MANAGER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SYSTEM_ADMIN,
    UserRole.DIRECTOR,
  )
  addExpenditure(@Param('id') id: string, @Body() dto: CreateExpenditureDto) {
    return this.projectsService.addExpenditure(id, dto);
  }

  @Post('milestones/:id/complete')
  completeMilestone(@Param('id') id: string) {
    return this.projectsService.completeMilestone(id);
  }
}
