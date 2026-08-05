# Haroti LPG — Deployment notes

> **Production VPS:** `169.58.127.129` (Debian 13, dedicated)  
> **Previous host decommissioned:** Aircargo VPS no longer runs Haroti.

Isolated Docker stack at `/opt/haroti-lpg`.

## 🌐 Custom Domain Setup

**Setting up with your own domain?** See the comprehensive [Domain Setup Guide](./docs/DOMAIN_SETUP.md) for step-by-step instructions on:
- DNS configuration
- SSL/HTTPS setup with Let's Encrypt
- Automated certificate renewal
- Troubleshooting

Quick setup command:
```bash
sudo bash scripts/setup-ssl.sh your-domain.com your-email@example.com
```

## Access

- **Web UI:** http://169.58.127.129/
- **API:** http://169.58.127.129/api/
- **Swagger:** http://169.58.127.129/api/docs
- **Demo login:** `admin` / `Password123!`

Production secrets live in `/opt/haroti-lpg/.env` on the server (not in git).

## Paths

- App: `/opt/haroti-lpg`
- Web: port `80` (public on dedicated VPS)
- Postgres: internal Docker network only

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
4. For dedicated VPS, bind web to `80:80` in `docker-compose.prod.yml`
5. `docker compose -f docker-compose.prod.yml --env-file .env up -d --build`
6. Open firewall: `ufw allow 80/tcp && ufw allow 443/tcp && ufw allow OpenSSH`

## Teardown

```bash
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml --env-file .env down -v --remove-orphans
rm -rf /opt/haroti-lpg
```
