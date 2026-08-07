import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import {
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
} from '../common/enums';
import { Station } from '../stations/station.entity';
import { User } from '../users/user.entity';

@Entity('safety_incidents')
export class SafetyIncident extends BaseEntity {
  @Column({ name: 'incident_number', unique: true, length: 40 })
  incidentNumber!: string;

  @Column({ type: 'enum', enum: IncidentType })
  type!: IncidentType;

  @Column({ type: 'enum', enum: IncidentSeverity })
  severity!: IncidentSeverity;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.OPEN,
  })
  status!: IncidentStatus;

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId?: string | null;

  @ManyToOne(() => Station, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'station_id' })
  station?: Station | null;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt!: Date;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'immediate_action', type: 'text', nullable: true })
  immediateAction?: string;

  @Column({ name: 'investigator_id', type: 'uuid', nullable: true })
  investigatorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'investigator_id' })
  investigator?: User;

  @Column({ name: 'root_cause', type: 'text', nullable: true })
  rootCause?: string;

  @Column({ name: 'reported_by_id', type: 'uuid', nullable: true })
  reportedById?: string;
}
