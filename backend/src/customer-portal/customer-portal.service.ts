import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CustomersService } from '../customers/customers.service';
import { PaycService } from '../payc/payc.service';
import { PriceList } from '../pricing/price-list.entity';
import { RefillRequestStatus, SaleStatus } from '../common/enums';
import { Sale } from '../sales/sale.entity';
import { Station } from '../stations/station.entity';
import { CustomerOtpChallenge } from './customer-otp-challenge.entity';
import { CustomerJwtPayload } from './customer-jwt-payload';
import { RefillRequest } from './refill-request.entity';

@Injectable()
export class CustomerPortalService {
  constructor(
    @InjectRepository(CustomerOtpChallenge)
    private readonly otpRepo: Repository<CustomerOtpChallenge>,
    @InjectRepository(RefillRequest)
    private readonly requestsRepo: Repository<RefillRequest>,
    @InjectRepository(PriceList)
    private readonly pricesRepo: Repository<PriceList>,
    @InjectRepository(Station)
    private readonly stationsRepo: Repository<Station>,
    @InjectRepository(Sale)
    private readonly salesRepo: Repository<Sale>,
    private readonly jwtService: JwtService,
    private readonly customersService: CustomersService,
    private readonly paycService: PaycService,
    private readonly notificationsService: NotificationsService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async requestOtp(phone: string) {
    const normalized = this.normalizePhone(phone);
    if (!normalized) throw new BadRequestException('Invalid phone number');

    const customer = await this.findCustomerByPhone(normalized);
    if (!customer) {
      throw new BadRequestException('No account found for this phone number');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.otpRepo.delete({ phone: normalized });
    await this.otpRepo.save(
      this.otpRepo.create({ phone: normalized, code, expiresAt, attempts: 0 }),
    );

    await this.notificationsService.sendSms(
      normalized,
      `Haroti Gas login code: ${code}. Valid for 10 minutes.`,
    );

    return {
      sent: true,
      phone: normalized,
      expiresAt,
      devCode: process.env.NODE_ENV === 'production' ? undefined : code,
    };
  }

  async verifyOtp(phone: string, code: string) {
    const normalized = this.normalizePhone(phone);
    if (!normalized) throw new BadRequestException('Invalid phone number');

    const challenge = await this.otpRepo.findOne({
      where: { phone: normalized },
      order: { createdAt: 'DESC' },
    });
    if (!challenge || challenge.expiresAt < new Date()) {
      throw new UnauthorizedException('OTP expired or not found');
    }
    if (challenge.attempts >= 5) {
      throw new UnauthorizedException('Too many attempts');
    }
    if (challenge.code !== code.trim()) {
      challenge.attempts += 1;
      await this.otpRepo.save(challenge);
      throw new UnauthorizedException('Invalid OTP');
    }

    const customer = await this.findCustomerByPhone(normalized);
    if (!customer) throw new UnauthorizedException('Customer not found');

    await this.otpRepo.delete({ phone: normalized });

    const payload: CustomerJwtPayload = {
      sub: customer.id,
      phone: normalized,
      fullName: customer.fullName,
      kind: 'customer',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        outstandingBalance: customer.outstandingBalance,
      },
    };
  }

  async profile(customerId: string) {
    return this.customersService.findOne(customerId);
  }

  async prices() {
    const now = new Date();
    const lists = await this.pricesRepo.find({
      where: { isActive: true },
      relations: { station: true },
      order: { effectiveFrom: 'DESC' },
    });
    const active = lists.filter(
      (p) => p.effectiveFrom <= now && (!p.effectiveTo || p.effectiveTo >= now),
    );
    const network = active.find((p) => !p.stationId);
    return {
      networkPricePerKg: network?.pricePerKg ?? '1850.00',
      stations: active
        .filter((p) => p.stationId)
        .map((p) => ({
          stationId: p.stationId,
          stationCode: p.station?.code,
          pricePerKg: p.pricePerKg,
        })),
    };
  }

  async nearbyStations() {
    const stations = await this.stationsRepo.find({
      where: { status: 'ACTIVE' as never },
      order: { code: 'ASC' },
    });
    return stations.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      district: s.district,
      latitude: s.latitude,
      longitude: s.longitude,
      currentStockKg: s.currentStockKg,
    }));
  }

  async receipts(customerId: string) {
    return this.salesRepo.find({
      where: { customerId, status: SaleStatus.COMPLETED },
      relations: { station: true },
      order: { soldAt: 'DESC' },
      take: 20,
    });
  }

  async statement(customerId: string) {
    return this.customersService.statement(customerId);
  }

  async paycMeters(customerId: string) {
    const meters = await this.paycService.findAll();
    return meters.filter((m) => m.customerId === customerId);
  }

  async createRefillRequest(
    customerId: string,
    body: {
      stationId?: string;
      quantityKg: number;
      preferredDate?: string;
      notes?: string;
    },
  ) {
    const requestNumber = `RR-${Date.now().toString().slice(-8)}`;
    return this.requestsRepo.save(
      this.requestsRepo.create({
        requestNumber,
        customerId,
        stationId: body.stationId,
        quantityKg: String(body.quantityKg),
        preferredDate: body.preferredDate,
        notes: body.notes,
        status: RefillRequestStatus.PENDING,
      }),
    );
  }

  listRefillRequests(customerId: string) {
    return this.requestsRepo.find({
      where: { customerId },
      relations: { station: true },
      order: { createdAt: 'DESC' },
    });
  }

  loyalty(customerId: string) {
    return this.loyaltyService.getOrCreate(customerId);
  }

  listAllRefillRequests() {
    return this.requestsRepo.find({
      relations: { customer: true, station: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async updateRefillRequest(id: string, status: RefillRequestStatus) {
    const req = await this.requestsRepo.findOne({ where: { id } });
    if (!req) throw new BadRequestException('Request not found');
    req.status = status;
    return this.requestsRepo.save(req);
  }

  private async findCustomerByPhone(phone: string) {
    const customers = await this.customersService.findAll();
    return customers.find(
      (c) => c.phone && this.normalizePhone(c.phone) === phone,
    );
  }

  private normalizePhone(phone: string) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) return undefined;
    if (digits.startsWith('265')) return `+${digits}`;
    if (digits.startsWith('0')) return `+265${digits.slice(1)}`;
    return `+${digits}`;
  }
}
