import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { asDecimal } from '../common/decimal';
import { UserRole } from '../common/enums';
import { JwtPayload } from '../auth/jwt-payload';
import { StationScopeService } from '../auth/station-scope.service';
import { Station } from '../stations/station.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ADMIN_ONLY_ROLES,
  OPS_MANAGEABLE_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  STATION_SCOPED_ROLES,
} from './user.constants';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Station)
    private readonly stationsRepo: Repository<Station>,
    private readonly stationScope: StationScopeService,
  ) {}

  listRoles() {
    return Object.values(UserRole).map((role) => ({
      value: role,
      label: ROLE_LABELS[role],
      description: ROLE_DESCRIPTIONS[role],
      requiresStation: STATION_SCOPED_ROLES.has(role),
    }));
  }

  async findAll(actor: JwtPayload, stationId?: string) {
    this.assertCanManage(actor);

    const where: { stationId?: string } = {};
    if (stationId) {
      where.stationId = stationId;
    } else if (!this.stationScope.isNetworkWide(actor.role)) {
      where.stationId = actor.stationId!;
    }

    const users = await this.usersRepo.find({
      where,
      relations: { station: true },
      order: { fullName: 'ASC' },
    });

    return users.map((user) => this.toResponse(user));
  }

  async findOne(actor: JwtPayload, id: string) {
    this.assertCanManage(actor);
    const user = await this.getUserOrThrow(id);
    this.assertCanViewUser(actor, user);
    return this.toResponse(user);
  }

  async create(actor: JwtPayload, dto: CreateUserDto) {
    this.assertCanManage(actor);
    this.assertCanAssignRole(actor, dto.role);

    const username = dto.username.trim().toLowerCase();
    const existing = await this.usersRepo.findOne({ where: { username } });
    if (existing) {
      throw new BadRequestException('Username is already taken');
    }

    await this.validateStationAssignment(dto.role, dto.stationId ?? null);

    const user = this.usersRepo.create({
      username,
      fullName: dto.fullName.trim(),
      email: dto.email?.trim() || undefined,
      phone: dto.phone?.trim() || undefined,
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: dto.role,
      stationId: STATION_SCOPED_ROLES.has(dto.role) ? dto.stationId ?? null : null,
      isActive: dto.isActive ?? true,
      canOverridePrice: dto.canOverridePrice ?? false,
      discountLimitPercent: asDecimal(dto.discountLimitPercent ?? 0, 2),
    });

    const saved = await this.usersRepo.save(user);
    return this.toResponse(await this.getUserOrThrow(saved.id));
  }

  async update(actor: JwtPayload, id: string, dto: UpdateUserDto) {
    this.assertCanManage(actor);
    const user = await this.getUserOrThrow(id);
    this.assertCanViewUser(actor, user);

    if (actor.sub === id) {
      if (dto.role && dto.role !== user.role) {
        throw new ForbiddenException('You cannot change your own role');
      }
      if (dto.isActive === false) {
        throw new ForbiddenException('You cannot deactivate your own account');
      }
    }

    if (dto.role) {
      this.assertCanAssignRole(actor, dto.role);
    }

    const nextRole = dto.role ?? user.role;
    const nextStationId =
      dto.stationId !== undefined
        ? dto.stationId
        : dto.role !== undefined
          ? STATION_SCOPED_ROLES.has(nextRole)
            ? user.stationId ?? null
            : null
          : user.stationId ?? null;

    await this.validateStationAssignment(nextRole, nextStationId);

    if (dto.fullName !== undefined) user.fullName = dto.fullName.trim();
    if (dto.email !== undefined) user.email = dto.email.trim() || undefined;
    if (dto.phone !== undefined) user.phone = dto.phone.trim() || undefined;
    if (dto.role !== undefined) user.role = dto.role;
    user.stationId = STATION_SCOPED_ROLES.has(nextRole) ? nextStationId : null;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.canOverridePrice !== undefined) {
      user.canOverridePrice = dto.canOverridePrice;
    }
    if (dto.discountLimitPercent !== undefined) {
      user.discountLimitPercent = asDecimal(dto.discountLimitPercent, 2);
    }
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const saved = await this.usersRepo.save(user);
    return this.toResponse(await this.getUserOrThrow(saved.id));
  }

  private assertCanManage(actor: JwtPayload) {
    const allowed = new Set<UserRole>([
      UserRole.SYSTEM_ADMIN,
      UserRole.DIRECTOR,
      UserRole.OPERATIONS_MANAGER,
    ]);
    if (!allowed.has(actor.role)) {
      throw new ForbiddenException('You do not have permission to manage staff');
    }
  }

  private assertCanViewUser(actor: JwtPayload, user: User) {
    if (this.stationScope.isNetworkWide(actor.role)) return;
    if (user.stationId !== actor.stationId) {
      throw new ForbiddenException('Access denied for this staff member');
    }
  }

  private assertCanAssignRole(actor: JwtPayload, role: UserRole) {
    if (actor.role === UserRole.OPERATIONS_MANAGER) {
      if (!OPS_MANAGEABLE_ROLES.has(role)) {
        throw new ForbiddenException(
          'Operations managers can only assign station-level roles',
        );
      }
      return;
    }

    if (ADMIN_ONLY_ROLES.has(role) && actor.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Only system admins can assign the system admin role');
    }
  }

  private async validateStationAssignment(role: UserRole, stationId: string | null) {
    if (STATION_SCOPED_ROLES.has(role)) {
      if (!stationId) {
        throw new BadRequestException('A station is required for this role');
      }
      const station = await this.stationsRepo.findOne({ where: { id: stationId } });
      if (!station) {
        throw new BadRequestException('Selected station was not found');
      }
      return;
    }

    if (stationId) {
      throw new BadRequestException('Network roles cannot be assigned to a station');
    }
  }

  private async getUserOrThrow(id: string) {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: { station: true },
    });
    if (!user) throw new NotFoundException('Staff member not found');
    return user;
  }

  private toResponse(user: User) {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email ?? null,
      phone: user.phone ?? null,
      role: user.role,
      stationId: user.stationId ?? null,
      station: user.station
        ? {
            id: user.station.id,
            code: user.station.code,
            name: user.station.name,
            district: user.station.district,
          }
        : null,
      isActive: user.isActive,
      canOverridePrice: user.canOverridePrice,
      discountLimitPercent: Number(user.discountLimitPercent),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
