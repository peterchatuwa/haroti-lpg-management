# Haroti LPG — Aircargo VPS deploy notes

Isolated Docker stack on `server1.aircargo.mw`. Does not use host ports 80/443/3306/6379.

## Paths

- App: `/opt/haroti-lpg`
- Public URL: `https://lpg.aircargo.mw`
- Local proxy target: `http://127.0.0.1:18088`

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
