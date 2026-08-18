import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { NotificationChannel, UserRole } from '../common/enums';
import { asDecimal } from '../common/decimal';
import { JwtPayload } from '../auth/jwt-payload';
import { StationScopeService } from '../auth/station-scope.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PermissionsService } from '../permissions/permissions.service';
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

const INVITE_TTL_MS = 72 * 60 * 60 * 1000;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Station)
    private readonly stationsRepo: Repository<Station>,
    private readonly stationScope: StationScopeService,
    private readonly permissionsService: PermissionsService,
    private readonly notificationsService: NotificationsService,
    private readonly config: ConfigService,
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
    await this.assertPermission(actor, 'staff.view');

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
    await this.assertPermission(actor, 'staff.view');
    const user = await this.getUserOrThrow(id);
    this.assertCanViewUser(actor, user);
    return this.toResponse(user);
  }

  async create(actor: JwtPayload, dto: CreateUserDto) {
    await this.assertPermission(actor, 'staff.create');
    this.assertCanAssignRole(actor, dto.role);

    const sendInvite = dto.sendInvite ?? false;
    if (sendInvite) {
      await this.assertPermission(actor, 'staff.invite');
      if (!dto.email?.trim()) {
        throw new BadRequestException(
          'Email is required when sending an invite',
        );
      }
    } else if (!dto.password) {
      throw new BadRequestException(
        'Password is required unless sending an invite',
      );
    }

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
      passwordHash: await bcrypt.hash(
        sendInvite ? randomBytes(24).toString('hex') : dto.password!,
        10,
      ),
      role: dto.role,
      stationId: STATION_SCOPED_ROLES.has(dto.role)
        ? (dto.stationId ?? null)
        : null,
      isActive: dto.isActive ?? true,
      canOverridePrice: dto.canOverridePrice ?? false,
      discountLimitPercent: asDecimal(dto.discountLimitPercent ?? 0, 2),
      mustSetPassword: sendInvite,
    });

    const saved = await this.usersRepo.save(user);
    if (sendInvite) {
      await this.sendInvite(await this.getUserOrThrow(saved.id));
    }
    return this.toResponse(await this.getUserOrThrow(saved.id));
  }

  async resendInvite(actor: JwtPayload, id: string) {
    await this.assertPermission(actor, 'staff.invite');
    const user = await this.getUserOrThrow(id);
    this.assertCanViewUser(actor, user);
    if (!user.email) {
      throw new BadRequestException(
        'Staff member has no email address on file',
      );
    }
    await this.sendInvite(user);
    return this.toResponse(await this.getUserOrThrow(id));
  }

  async update(actor: JwtPayload, id: string, dto: UpdateUserDto) {
    await this.assertPermission(actor, 'staff.edit');
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
            ? (user.stationId ?? null)
            : null
          : (user.stationId ?? null);

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
      user.mustSetPassword = false;
      user.inviteTokenHash = null;
      user.inviteExpiresAt = null;
    }

    const saved = await this.usersRepo.save(user);
    return this.toResponse(await this.getUserOrThrow(saved.id));
  }

  private async sendInvite(user: User) {
    const token = randomBytes(32).toString('hex');
    user.inviteTokenHash = createHash('sha256').update(token).digest('hex');
    user.inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS);
    user.mustSetPassword = true;
    await this.usersRepo.save(user);

    const erpUrl = this.config.get<string>(
      'ERP_PUBLIC_URL',
      'https://harotiholdingslimited.com/erp',
    );
    const link = `${erpUrl.replace(/\/$/, '')}/accept-invite?token=${token}`;
    const roleLabel = ROLE_LABELS[user.role];

    await this.notificationsService.dispatch({
      eventType: 'staff.invite',
      title: 'Haroti Gas ERP — set up your account',
      body: [
        `Hello ${user.fullName},`,
        '',
        `You have been invited to Haroti Gas ERP as ${roleLabel}.`,
        `Your username is: ${user.username}`,
        '',
        `Set your password using this link (valid for 72 hours):`,
        link,
        '',
        'If you did not expect this email, you can ignore it.',
      ].join('\n'),
      email: user.email,
      userId: user.id,
      channels: [NotificationChannel.EMAIL],
      mandatory: true,
    });
    await this.notificationsService.processQueue(5);
  }

  private async assertPermission(actor: JwtPayload, permission: string) {
    const allowed = await this.permissionsService.hasPermission(
      actor.role,
      permission,
    );
    if (!allowed) {
      throw new ForbiddenException(
        'You do not have permission to manage staff',
      );
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
      throw new ForbiddenException(
        'Only system admins can assign the system admin role',
      );
    }
  }

  private async validateStationAssignment(
    role: UserRole,
    stationId: string | null,
  ) {
    if (STATION_SCOPED_ROLES.has(role)) {
      if (!stationId) {
        throw new BadRequestException('A station is required for this role');
      }
      const station = await this.stationsRepo.findOne({
        where: { id: stationId },
      });
      if (!station) {
        throw new BadRequestException('Selected station was not found');
      }
      return;
    }

    if (stationId) {
      throw new BadRequestException(
        'Network roles cannot be assigned to a station',
      );
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
    const invitePending =
      user.mustSetPassword &&
      !!user.inviteTokenHash &&
      !!user.inviteExpiresAt &&
      user.inviteExpiresAt.getTime() > Date.now();

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
      invitePending,
      mustSetPassword: user.mustSetPassword,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
