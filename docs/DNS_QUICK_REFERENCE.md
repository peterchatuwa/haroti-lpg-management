# DNS Configuration Quick Reference

## Problem
Cannot access Haroti LPG system via domain name (harotilimited.com/mw or lpg.aircargo.mw)

## Root Cause
✗ DNS A records are not configured  
✓ Server is operational at IP: 169.58.127.129

## Immediate Access
Use direct IP address:
- Web: http://169.58.127.129/
- API: http://169.58.127.129/api/

## Fix (Choose one option)

### Option A: Use harotilimited.com
1. Register domain at registrar (Namecheap, GoDaddy, etc.)
2. Add DNS A record: `@ → 169.58.127.129`
3. Add DNS A record: `lpg → 169.58.127.129`
4. Wait 1-4 hours for propagation
5. Update CORS in `/opt/haroti-lpg/.env`:
   ```
   CORS_ORIGIN=https://harotilimited.com,https://lpg.harotilimited.com
   ```
6. Restart: `docker compose -f docker-compose.prod.yml --env-file .env restart`

### Option B: Use lpg.aircargo.mw
1. Access DNS settings for aircargo.mw domain
2. Add DNS A record: `lpg → 169.58.127.129`
3. Wait 1-4 hours for propagation
4. Update CORS in `/opt/haroti-lpg/.env`:
   ```
   CORS_ORIGIN=https://lpg.aircargo.mw
   ```
5. Restart: `docker compose -f docker-compose.prod.yml --env-file .env restart`

## Verify DNS
```bash
# Check if DNS is configured
nslookup harotilimited.com
nslookup lpg.aircargo.mw

# Should return: 169.58.127.129
```

## Run Diagnostic
```bash
./scripts/check-access.sh
```

## Full Documentation
See: `docs/DOMAIN_DNS_SETUP.md`

## SSL Setup (After DNS works)
```bash
apt-get install certbot python3-certbot-nginx
certbot certonly --standalone -d lpg.harotilimited.com
# Then update nginx.conf and docker-compose.prod.yml
```

## Status Checklist
- [✓] Server accessible at 169.58.127.129
- [✓] Application running (HTTP 200 OK)
- [✗] DNS A records configured
- [✗] Domain accessible
- [✗] SSL certificate installed

## Contact
For DNS setup: Contact your domain registrar or DNS provider  
For app issues: See README.DEPLOY.md
