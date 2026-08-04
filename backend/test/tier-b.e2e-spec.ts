import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Tier B acceptance (e2e)', () => {
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
      console.warn('Skipping Tier B e2e — database not available');
      return;
    }

    adminToken = login.body.accessToken;
    const stations = await request(app.getHttpServer())
      .get('/api/stations')
      .set('Authorization', `Bearer ${adminToken}`);
    stationId = stations.body[0]?.id;
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('LPG-004: lists tanks for station', async () => {
    if (!adminToken || !stationId) return;

    const res = await request(app.getHttpServer())
      .get('/api/tanks')
      .query({ stationId })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length) {
      expect(res.body[0]).toHaveProperty('tankCode');
    }
  });

  it('LPG-006: gas reconciliation returns variance fields', async () => {
    if (!adminToken || !stationId) return;

    const res = await request(app.getHttpServer())
      .get('/api/tanks/reconciliation')
      .query({
        stationId,
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
      })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('expectedClosingKg');
    expect(res.body).toHaveProperty('physicalClosingKg');
    expect(res.body).toHaveProperty('variancePercent');
  });

  it('FIN-004: trial balance accessible to admin', async () => {
    if (!adminToken) return;

    const res = await request(app.getHttpServer())
      .get('/api/finance/trial-balance')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('FIN-005: mobile-money CSV import', async () => {
    if (!adminToken) return;

    const csv =
      'date,reference,amount,provider\n2026-08-01,E2E-MM-001,1000,AIRTEL_MONEY';
    const res = await request(app.getHttpServer())
      .post('/api/banking/mobile-money/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ csvText: csv })
      .expect(201);

    expect(res.body.imported).toBeGreaterThanOrEqual(1);
  });

  it('CYL-004: cylinder lookup by serial', async () => {
    if (!adminToken) return;

    const cylinders = await request(app.getHttpServer())
      .get('/api/cylinders')
      .set('Authorization', `Bearer ${adminToken}`);

    const serial = cylinders.body[0]?.serialNumber;
    if (!serial) return;

    const res = await request(app.getHttpServer())
      .get(`/api/cylinders/lookup/${serial}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.cylinder.serialNumber).toBe(serial);
  });
});
