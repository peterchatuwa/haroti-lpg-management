import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums';
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_DEFINITIONS,
} from './permission.defaults';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';

@Injectable()
export class PermissionsService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsService.name);
  private cache = new Map<UserRole, Set<string>>();

  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionsRepo: Repository<RolePermission>,
  ) {}

  async onModuleInit() {
    await this.ensureSeeded();
    await this.refreshCache();
  }

  async ensureSeeded() {
    const count = await this.permissionsRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding permission catalogue and default role bundles');
    await this.permissionsRepo.save(
      PERMISSION_DEFINITIONS.map((def) => this.permissionsRepo.create(def)),
    );

    const rows: RolePermission[] = [];
    for (const [role, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS) as [
      UserRole,
      string[],
    ][]) {
      for (const permissionKey of keys) {
        rows.push(this.rolePermissionsRepo.create({ role, permissionKey }));
      }
    }
    await this.rolePermissionsRepo.save(rows);
  }

  async refreshCache() {
    this.cache.clear();
    const rows = await this.rolePermissionsRepo.find();
    for (const row of rows) {
      if (!this.cache.has(row.role)) {
        this.cache.set(row.role, new Set());
      }
      this.cache.get(row.role)!.add(row.permissionKey);
    }
  }

  async listPermissions() {
    return this.permissionsRepo.find({
      order: { category: 'ASC', key: 'ASC' },
    });
  }

  async getRolePermissions(role: UserRole) {
    const rows = await this.rolePermissionsRepo.find({
      where: { role },
      relations: { permission: true },
      order: { permissionKey: 'ASC' },
    });
    return rows.map((row) => row.permissionKey);
  }

  async listRoleBundles() {
    const roles = Object.values(UserRole);
    const bundles = await Promise.all(
      roles.map(async (role) => ({
        role,
        permissions: await this.getRolePermissions(role),
      })),
    );
    return bundles;
  }

  async updateRolePermissions(role: UserRole, permissionKeys: string[]) {
    const validKeys = new Set(
      (await this.permissionsRepo.find()).map((p) => p.key),
    );
    for (const key of permissionKeys) {
      if (!validKeys.has(key)) {
        throw new BadRequestException(`Unknown permission: ${key}`);
      }
    }

    await this.rolePermissionsRepo.delete({ role });
    if (permissionKeys.length) {
      await this.rolePermissionsRepo.save(
        permissionKeys.map((permissionKey) =>
          this.rolePermissionsRepo.create({ role, permissionKey }),
        ),
      );
    }
    await this.refreshCache();
    return this.getRolePermissions(role);
  }

  async hasPermission(role: UserRole, permission: string): Promise<boolean> {
    if (!this.cache.size) {
      await this.refreshCache();
    }
    return this.cache.get(role)?.has(permission) ?? false;
  }

  async hasAny(role: UserRole, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(role, permission)) {
        return true;
      }
    }
    return false;
  }

  async getPermissionsForRole(role: UserRole): Promise<string[]> {
    if (!this.cache.size) {
      await this.refreshCache();
    }
    return Array.from(this.cache.get(role) ?? []);
  }
}
