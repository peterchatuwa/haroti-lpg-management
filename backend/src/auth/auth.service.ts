import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { PermissionsService } from '../permissions/permissions.service';
import { User } from '../users/user.entity';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: { username: dto.username.toLowerCase() },
      relations: { station: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (user.mustSetPassword) {
      throw new UnauthorizedException(
        'Please accept your email invite and set a password before signing in',
      );
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      stationId: user.stationId,
      fullName: user.fullName,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: await this.buildUserProfile(user),
    };
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const user = await this.usersRepo.findOne({
      where: { inviteTokenHash: tokenHash },
      relations: { station: true },
    });
    if (
      !user ||
      !user.inviteExpiresAt ||
      user.inviteExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invite link is invalid or has expired');
    }
    if (!user.isActive) {
      throw new BadRequestException('This account is inactive');
    }

    user.passwordHash = await bcrypt.hash(dto.password, 10);
    user.mustSetPassword = false;
    user.inviteTokenHash = null;
    user.inviteExpiresAt = null;
    await this.usersRepo.save(user);

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      stationId: user.stationId,
      fullName: user.fullName,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: await this.buildUserProfile(user),
    };
  }

  async me(userId: string) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: { station: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.buildUserProfile(user);
  }

  private async buildUserProfile(user: User) {
    const permissions = await this.permissionsService.getPermissionsForRole(
      user.role,
    );
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      stationId: user.stationId,
      station: user.station
        ? {
            id: user.station.id,
            code: user.station.code,
            name: user.station.name,
            district: user.station.district,
            currentStockKg: Number(user.station.currentStockKg),
          }
        : null,
      canOverridePrice: user.canOverridePrice,
      discountLimitPercent: Number(user.discountLimitPercent),
      permissions,
    };
  }
}
