import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { ENTITIES } from './entities';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? '5432'),
  username: process.env.DATABASE_USER ?? 'haroti',
  password: process.env.DATABASE_PASSWORD ?? 'haroti_dev',
  database: process.env.DATABASE_NAME ?? 'haroti_lpg',
  entities: ENTITIES,
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
});
