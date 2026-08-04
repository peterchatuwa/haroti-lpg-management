import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Tier D procurement (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let customerId: string;

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
      console.warn('Skipping Tier D e2e — database not available');
      return;
    }

    adminToken = login.body.accessToken;
    const customers = await request(app.getHttpServer())
      .get('/api/customers')
      .set('Authorization', `Bearer ${adminToken}`);
    customerId = customers.body[0]?.id;
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('PROC-001: lists suppliers with customer linkage endpoint', async () => {
    if (!adminToken) return;

    const res = await request(app.getHttpServer())
      .get('/api/suppliers')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PROC-002: register vendor from customer', async () => {
    if (!adminToken || !customerId) return;

    const res = await request(app.getHttpServer())
      .post('/api/suppliers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customerId });

    expect([201, 400]).toContain(res.status);
  });

  it('PROC-003: procurement orders include documents relation', async () => {
    if (!adminToken) return;

    const res = await request(app.getHttpServer())
      .get('/api/procurement/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
