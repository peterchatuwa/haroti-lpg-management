import { TargetMetric, TargetPeriod, TargetScope } from '../../common/enums';

export class CreateTargetDto {
  scope!: TargetScope;
  stationId?: string;
  metric!: TargetMetric;
  periodType!: TargetPeriod;
  year!: number;
  period!: number;
  targetValue!: number;
  notes?: string;
}
