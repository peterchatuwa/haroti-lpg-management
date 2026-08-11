import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { UserRole } from '../common/enums';
import { Permission } from './permission.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn({ length: 40 })
  role!: UserRole;

  @PrimaryColumn({ name: 'permission_key', length: 80 })
  permissionKey!: string;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_key' })
  permission?: Permission;
}
