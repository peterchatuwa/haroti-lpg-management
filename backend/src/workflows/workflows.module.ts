import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalTask } from './approval-task.entity';
import {
  ApprovalTasksController,
  WorkflowsController,
} from './workflows.controller';
import { WorkflowDefinition } from './workflow-definition.entity';
import { WorkflowStep } from './workflow-step.entity';
import { WorkflowsService } from './workflows.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowDefinition,
      WorkflowStep,
      ApprovalTask,
    ]),
  ],
  controllers: [WorkflowsController, ApprovalTasksController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
