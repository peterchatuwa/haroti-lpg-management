# Haroti LPG — Deployment notes

> **Production VPS:** `169.58.127.129` (Debian 13, dedicated)  
> **Domain:** `harotiholdingslimited.com`

Isolated Docker stack at `/opt/haroti-lpg`.

## Access

| Service | URL |
|---------|-----|
| **Marketing website** | http://harotiholdingslimited.com/ (port **80**) |
| **ERP web UI** | http://harotiholdingslimited.com:8080/ |
| **Customer portal** | http://harotiholdingslimited.com:8080/portal |
| **Staff login** | http://harotiholdingslimited.com:8080/login |
| **API** | http://harotiholdingslimited.com:8080/api/ |
| **Swagger** | http://harotiholdingslimited.com:8080/api/docs |
| **Demo login** | `admin` / `Password123!` |

Production secrets live in `/opt/haroti-lpg/.env` on the server (not in git).

## Paths

- App: `/opt/haroti-lpg`
- Marketing site: port **80** (`haroti-marketing` container)
- ERP + API proxy: port **8080** (`haroti-web` container)
- Postgres / Redis: internal Docker network only

## Start / stop

```bash
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker compose -f docker-compose.prod.yml --env-file .env ps
docker compose -f docker-compose.prod.yml --env-file .env down
```

Migrations run automatically on API startup (`migrationsRun: true`).

## Fresh deploy on a new VPS

1. Install Docker Engine (`curl -fsSL https://get.docker.com | sh`)
2. Clone `https://github.com/peterchatuwa/haroti-lpg-management` to `/opt/haroti-lpg`
3. Copy `.env.production.example` → `.env` and set strong `DATABASE_PASSWORD` + `JWT_SECRET`
4. Set `CORS_ORIGIN` and `VITE_ERP_BASE_URL` for your domain (see example file)
5. `docker compose -f docker-compose.prod.yml --env-file .env up -d --build`
6. Open firewall: `ufw allow 80/tcp && ufw allow 8080/tcp && ufw allow 443/tcp && ufw allow OpenSSH`

## Local development

```bash
# Terminal 1 — marketing site (port 5174)
cd website && npm install && npm run dev

# Terminal 2 — ERP frontend (port 5173) + backend (port 3000)
cd frontend && npm run dev
cd backend && npm run start:dev
```

Set `website/.env.local` with `VITE_ERP_BASE_URL=http://localhost:5173` if your ERP dev server uses a different port.

## Teardown

```bash
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml --env-file .env down -v --remove-orphans
rm -rf /opt/haroti-lpg
```
