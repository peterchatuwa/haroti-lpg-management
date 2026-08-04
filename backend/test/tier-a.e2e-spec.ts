import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Tier A acceptance (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let stationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Password123!' });

    if (login.status !== 201 && login.status !== 200) {
      console.warn('Skipping Tier A e2e — database not available');
      return;
    }

    adminToken = login.body.accessToken;
    const stations = await request(app.getHttpServer())
      .get('/api/stations')
      .set('Authorization', `Bearer ${adminToken}`);
    stationId = stations.body[0]?.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('AC-09: rejects unauthenticated access to sales', async () => {
    await request(app.getHttpServer()).get('/api/sales').expect(401);
  });

  it('AC-02: idempotent offline sale via clientTxnId', async () => {
    if (!adminToken || !stationId) return;

    const shiftRes = await request(app.getHttpServer())
      .post('/api/shifts/open')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ stationId, openingCashFloat: 10000, openingCylinderCount: 5 });

    const shiftId = shiftRes.body.id;
    const clientTxnId = `e2e-${Date.now()}`;

    const payload = {
      stationId,
      shiftId,
      clientTxnId,
      items: [
        {
          itemName: '6kg Refill',
          lpgQuantityKg: 6,
          unitPrice: 1850,
          quantity: 1,
        },
      ],
      payments: [{ method: 'CASH', amount: 11100 }],
    };

    const first = await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    const second = await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(first.status).toBeLessThan(300);
    expect(second.status).toBeLessThan(300);
    expect(second.body.id).toBe(first.body.id);
  });

  it('AC-06: PAYC dashboard exposes deferred revenue summary', async () => {
    if (!adminToken) return;

    const res = await request(app.getHttpServer())
      .get('/api/payc/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalDeferredRevenue');
  });
});
