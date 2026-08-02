import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: { username: dto.username.toLowerCase() },
      relations: { station: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid username or password');
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
      user: {
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
            }
          : null,
        canOverridePrice: user.canOverridePrice,
        discountLimitPercent: Number(user.discountLimitPercent),
      },
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
    };
  }
}
