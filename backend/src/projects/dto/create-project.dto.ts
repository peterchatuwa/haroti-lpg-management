import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CommercialStream, Currency, ProjectType } from '../../common/enums';

class MilestoneDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsNumber()
  @Min(0)
  budgetAllocation!: number;
}

export class CreateProjectDto {
  @IsOptional()
  @IsString()
  projectCode?: string;

  @IsString()
  name!: string;

  @IsEnum(ProjectType)
  type!: ProjectType;

  @IsOptional()
  @IsEnum(CommercialStream)
  commercialStream?: CommercialStream;

  @IsOptional()
  @IsUUID()
  stationId?: string;

  @IsNumber()
  @Min(0)
  approvedBudget!: number;

  @IsOptional()
  @IsString()
  grantReference?: string;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  targetEndDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones?: MilestoneDto[];
}
