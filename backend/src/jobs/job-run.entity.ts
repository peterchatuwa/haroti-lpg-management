import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

@Entity('job_runs')
export class JobRun extends BaseEntity {
  @Column({ name: 'job_name', length: 80 })
  jobName!: string;

  @Column({ length: 20, default: 'RUNNING' })
  status!: 'RUNNING' | 'SUCCESS' | 'FAILED';

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt!: Date;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt?: Date;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;
}
