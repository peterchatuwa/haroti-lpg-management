# AGENTS.md

## Cursor Cloud specific instructions

This repo is a monorepo for the **Haroti Holdings LPG Management System** with three
independently-runnable Node/TypeScript apps. Standard commands live in each app's
`README.md` / `package.json`; only non-obvious cloud caveats are captured here.

### Services

| Service | Path | Dev command | URL | Notes |
|---------|------|-------------|-----|-------|
| Backend API | `backend/` | `npm run start:dev` | http://localhost:3000/api (Swagger: `/api/docs`) | NestJS. Needs PostgreSQL. Auto-runs migrations + seeds demo data on boot. |
| Frontend (LPG app) | `frontend/` | `npm run dev` | http://localhost:5173 | React PWA. Vite proxies `/api` → `http://localhost:3000`, so the backend must be running. Main product. |
| Marketing website | `website/` | `npm run dev -- --port 5175` | http://localhost:5175 | Static React/Vite site, no backend needed. Defaults to port 5173, which collides with the frontend — always pass a different `--port`. |

### PostgreSQL (required for the backend)

- Installed as a **system service** (native `apt`, PostgreSQL 16), not Docker. `docker`/`docker compose` are not available in this environment.
- It does **not** auto-start on VM boot. Start it with: `sudo pg_ctlcluster 16 main start`.
- Role `haroti` / password `haroti_dev` and database `haroti_lpg` are pre-created and match `backend/.env.example` defaults.
- `docker-compose.yml` lists a Redis service, but the backend code does **not** use Redis — you can ignore it.

### Backend gotchas

- Requires a `.env` file: `cp backend/.env.example backend/.env` (its defaults also match `app.module.ts` fallbacks, so a fresh checkout still connects).
- On startup it runs TypeORM migrations (the baseline migration `synchronize`s the schema when the DB is empty) and then `SeedService` (an `OnModuleInit`) seeds stations, users, products, etc. No manual migrate/seed step is needed.
- Demo login: any seeded user with password `Password123!` (e.g. `admin`, `llw01.attendant`). See `README.md` for the full user/role list.
- Dev logs are very verbose (TypeORM SQL query logging is on when `NODE_ENV=development`).
- Reinstalling `backend/node_modules` (e.g. `npm ci`) **while `npm run start:dev` is running** makes the ts watcher throw transient "Cannot find type definition file for ..." errors and kills the process. Restart `npm run start:dev` after any dependency change.

### App flow note (for end-to-end testing the POS)

Recording a sale on the **Refill POS** page requires an **open shift** for the station first: go to **Shifts** and click **Open shift**, then the POS "Charge" button will succeed.

### Lint / test / build

- Backend: `npm test` (Jest), `npm run build` (nest build). `npm run lint` runs ESLint **with `--fix`** (it rewrites files); the repo currently has many pre-existing lint findings, so run lint in check-only mode (`npx eslint "{src,test}/**/*.ts"`) if you must avoid modifying files.
- Frontend & website: `npm run lint` (oxlint), `npm run build` (`tsc -b && vite build`).
