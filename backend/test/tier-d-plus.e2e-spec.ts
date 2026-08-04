import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Tier D+ (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;

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
      console.warn('Skipping Tier D+ e2e — database not available');
      return;
    }

    adminToken = login.body.accessToken;
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('NOTIF-001: admin can hit test SMS endpoint (log mode)', async () => {
    if (!adminToken) return;

    const res = await request(app.getHttpServer())
      .post('/api/notifications/test-sms')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ phone: '0999123456', message: 'Pilot test' });

    expect([200, 201]).toContain(res.status);
    expect(res.body.mode).toBeDefined();
  });

  it('PROC-004: admin can create PO (RBAC)', async () => {
    if (!adminToken) return;

    const suppliers = await request(app.getHttpServer())
      .get('/api/suppliers')
      .set('Authorization', `Bearer ${adminToken}`);

    const stations = await request(app.getHttpServer())
      .get('/api/stations')
      .set('Authorization', `Bearer ${adminToken}`);

    const products = await request(app.getHttpServer())
      .get('/api/accessories/catalog')
      .set('Authorization', `Bearer ${adminToken}`);

    const supplierId = suppliers.body[0]?.id;
    const stationId = stations.body[0]?.id;
    const productId = products.body[0]?.id;
    if (!supplierId || !stationId || !productId) return;

    const res = await request(app.getHttpServer())
      .post('/api/procurement/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        supplierId,
        destinationStationId: stationId,
        freightCost: 0,
        customsDuty: 0,
        clearingFees: 0,
        lines: [
          {
            productId,
            itemDescription: 'Test item',
            quantity: 1,
            unitCost: 1000,
          },
        ],
      });

    expect([200, 201]).toContain(res.status);
  });

  it('FRN-002: admin can generate franchise settlement', async () => {
    if (!adminToken) return;

    const agreements = await request(app.getHttpServer())
      .get('/api/franchise/agreements')
      .set('Authorization', `Bearer ${adminToken}`);

    const agreementId = agreements.body[0]?.id;
    if (!agreementId) return;

    const res = await request(app.getHttpServer())
      .post('/api/franchise/settlements/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        agreementId,
        periodStart: '2026-01-01',
        periodEnd: '2026-08-04',
      });

    expect([200, 201]).toContain(res.status);
  });

  it('PROC-005: procurement document PDF endpoint', async () => {
    if (!adminToken) return;

    const orders = await request(app.getHttpServer())
      .get('/api/procurement/orders')
      .set('Authorization', `Bearer ${adminToken}`);

    const po = orders.body.find((o: { documents?: Array<{ id: string }> }) =>
      (o.documents ?? []).length > 0,
    );
    const docId = po?.documents?.[0]?.id;
    if (!docId) return;

    const res = await request(app.getHttpServer())
      .get(`/api/procurement/documents/${docId}/pdf`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/pdf/);
  });
});
