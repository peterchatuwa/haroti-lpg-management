# Haroti LPG — Deployment notes

> **Production VPS:** `169.58.127.129` (Debian 13, dedicated)  
> **Previous host decommissioned:** Aircargo VPS no longer runs Haroti.

Isolated Docker stack at `/opt/haroti-lpg`.

## Access

### Current Access (IP-based)

- **Web UI:** http://169.58.127.129/
- **API:** http://169.58.127.129/api/
- **Swagger:** http://169.58.127.129/api/docs
- **Demo login:** `admin` / `Password123!`

### Domain Access (DNS Configuration Required)

⚠️ **DNS Not Configured**: As of August 10, 2026, the following domains are not accessible due to missing DNS records:
- `harotilimited.com` / `harotilimited.mw` - No DNS records
- `lpg.aircargo.mw` - No DNS records

**To configure domain access**: See detailed instructions in [`docs/DOMAIN_DNS_SETUP.md`](docs/DOMAIN_DNS_SETUP.md)

**Quick DNS check**: Run `scripts/check-access.sh` to diagnose connectivity issues

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
