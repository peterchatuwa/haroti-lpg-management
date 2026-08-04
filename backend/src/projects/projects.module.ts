import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceModule } from '../finance/finance.module';
import { CapitalProject } from './capital-project.entity';
import { ProjectExpenditure } from './project-expenditure.entity';
import { ProjectMilestone } from './project-milestone.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CapitalProject,
      ProjectMilestone,
      ProjectExpenditure,
    ]),
    FinanceModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
