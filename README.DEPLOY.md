# Haroti LPG — Deployment notes

> **Production VPS:** `169.58.127.129` (Debian 13, dedicated)  
> **Domain:** `harotiholdingslimited.com`

Isolated Docker stack at `/opt/haroti-lpg`, fronted by **Caddy** (HTTPS on port 443).

## Access

| Service | URL |
|---------|-----|
| **Marketing website** | https://harotiholdingslimited.com/ |
| **ERP / staff login** | https://harotiholdingslimited.com/erp/login |
| **Customer portal** | https://harotiholdingslimited.com/erp/portal |
| **API** | https://harotiholdingslimited.com/api/ |
| **Swagger** | https://harotiholdingslimited.com/api/docs |
| **Demo login** | `admin` / `Password123!` |

Use **https://** (not http). HTTP is redirected to HTTPS automatically.

Production secrets live in `/opt/haroti-lpg/.env` on the server (not in git).

## Architecture

- **Caddy** (host): ports 80 + 443, Let's Encrypt TLS, routes traffic
- **haroti-marketing** (Docker): `127.0.0.1:9080` — public website
- **haroti-web** (Docker): `127.0.0.1:9081` — ERP UI + `/api` proxy
- **haroti-api**, Postgres, Redis: internal Docker network only

Caddy config: `deploy/Caddyfile` → copied to `/etc/caddy/Caddyfile` on the VPS.

## Start / stop

```bash
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
sudo systemctl reload caddy
docker compose -f docker-compose.prod.yml --env-file .env ps
```

## Fresh deploy on a new VPS

1. Install Docker Engine (`curl -fsSL https://get.docker.com | sh`)
2. Install Caddy (`apt install -y caddy` or see https://caddyserver.com/docs/install)
3. Clone repo to `/opt/haroti-lpg`
4. Copy `.env.production.example` → `.env` and set secrets
5. Copy `deploy/Caddyfile` → `/etc/caddy/Caddyfile`
6. `docker compose -f docker-compose.prod.yml --env-file .env up -d --build`
7. `systemctl enable --now caddy`
8. Open firewall: `ufw allow 80/tcp && ufw allow 443/tcp && ufw allow OpenSSH`

## Local development

```bash
cd website && npm install && npm run dev    # http://localhost:5174
cd frontend && npm run dev                  # http://localhost:5173
cd backend && npm run start:dev             # http://localhost:3000
```

## Teardown

```bash
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml --env-file .env down -v --remove-orphans
rm -rf /opt/haroti-lpg
```
