# Haroti LPG — Aircargo VPS deploy notes

Isolated Docker stack on `server1.aircargo.mw`. Does not use host ports 80/443/3306/6379.

## Paths

- App: `/opt/haroti-lpg`
- Public URL: `https://lpg.aircargo.mw`
- Local proxy target: `http://127.0.0.1:18088`

## DNS (required for public subdomain)

Authoritative NS for `aircargo.mw`: `nyala.sdnp.org.mw`, `domwe.sdn.mw` (not this VPS).

Add an A record at SDN / your DNS host:

```text
lpg.aircargo.mw  →  104.207.70.23
```

The cPanel zone on this server already contains that A record, but public resolvers will not see it until SDN publishes it. After DNS propagates, AutoSSL / cPanel SSL for the subdomain can finish.

## Start / stop (Haroti only)

```bash
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker compose -f docker-compose.prod.yml --env-file .env ps
docker compose -f docker-compose.prod.yml --env-file .env down
```

## Rollback

```bash
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml --env-file .env down
# Optional: remove DB volume (destructive)
# docker volume rm haroti_haroti_pg_data
```

Existing cPanel sites, mail, MariaDB and host Redis are unaffected.

## Demo login

`admin` / `Password123!`
