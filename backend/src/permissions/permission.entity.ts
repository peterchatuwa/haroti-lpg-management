import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryColumn({ length: 80 })
  key!: string;

  @Column({ length: 200 })
  description!: string;

  @Column({ length: 40 })
  category!: string;
}
