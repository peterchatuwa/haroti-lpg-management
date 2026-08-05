# Setup Guide for harotiholdingslimited.com

This is your customized setup guide for deploying Haroti LPG Management to **harotiholdingslimited.com**.

## Current VPS Details

- **IP Address**: `169.58.127.129`
- **OS**: Debian 13
- **Installation Path**: `/opt/haroti-lpg`

## Step-by-Step Setup

### Step 1: Configure DNS

Log into your domain registrar/DNS provider and create an A record:

```
Type: A
Name: @ (or leave blank for root domain)
Value: 169.58.127.129
TTL: 3600 (or automatic)
```

**Optional**: If you want to use `www.harotiholdingslimited.com` as well, add:
```
Type: CNAME
Name: www
Value: harotiholdingslimited.com
TTL: 3600
```

**Wait 5-60 minutes** for DNS to propagate globally.

### Step 2: Verify DNS Propagation

From your local machine, check if DNS is working:

```bash
nslookup harotiholdingslimited.com
```

You should see `169.58.127.129` in the response.

### Step 3: Pull Latest Changes

SSH into your VPS:

```bash
ssh root@169.58.127.129
```

Then update the repository:

```bash
cd /opt/haroti-lpg
git pull origin cursor/domain-vps-setup-376b
```

### Step 4: Run the Automated SSL Setup

Execute the setup script with your domain and email:

```bash
cd /opt/haroti-lpg
sudo bash scripts/setup-ssl.sh harotiholdingslimited.com admin@harotiholdingslimited.com
```

Replace `admin@harotiholdingslimited.com` with your actual email address (for Let's Encrypt notifications).

**What the script does:**
1. ✅ Installs Certbot
2. ✅ Stops the web container temporarily
3. ✅ Obtains SSL certificate from Let's Encrypt
4. ✅ Copies certificates to `/opt/haroti-lpg/ssl/`
5. ✅ Updates nginx configuration with your domain
6. ✅ Updates CORS_ORIGIN to `https://harotiholdingslimited.com`
7. ✅ Sets up automatic certificate renewal (cron job)
8. ✅ Restarts application with SSL enabled

### Step 5: Configure Firewall

Ensure ports 80 and 443 are open:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow OpenSSH
sudo ufw enable
```

### Step 6: Verify Installation

1. **Check containers are running:**
   ```bash
   cd /opt/haroti-lpg
   docker compose -f docker-compose.prod.yml ps
   ```
   
   You should see 3 containers running:
   - `haroti-postgres`
   - `haroti-api`
   - `haroti-web`

2. **Visit your website:**
   - Open https://harotiholdingslimited.com in your browser
   - You should see the Haroti LPG login page
   - Browser should show a padlock icon (secure connection)

3. **Test the API:**
   - Visit https://harotiholdingslimited.com/api/docs
   - You should see the Swagger API documentation

4. **Login with demo credentials:**
   - Username: `admin`
   - Password: `Password123!`

### Step 7: Test SSL Configuration

Check your SSL grade at [SSL Labs](https://www.ssllabs.com/ssltest/analyze.html?d=harotiholdingslimited.com)

You should get an **A** or **A+** rating.

## Your URLs

After setup is complete, your application will be available at:

- **Main Application**: https://harotiholdingslimited.com
- **API Documentation**: https://harotiholdingslimited.com/api/docs
- **API Endpoint**: https://harotiholdingslimited.com/api/

HTTP requests will automatically redirect to HTTPS.

## Certificate Renewal

Your SSL certificate will automatically renew every 90 days via a cron job. The renewal runs daily at 3 AM and will:
1. Check if renewal is needed
2. Renew the certificate if within 30 days of expiry
3. Copy new certificates to the application
4. Restart the web container

No manual intervention required!

## Troubleshooting

### Certificate Obtainment Fails

**Check DNS propagation:**
```bash
nslookup harotiholdingslimited.com
dig harotiholdingslimited.com +short
```

**Check if port 80 is available:**
```bash
sudo netstat -tulpn | grep :80
```

**Manually test certificate:**
```bash
sudo certbot certonly --standalone --test-cert -d harotiholdingslimited.com
```

### Application Not Loading

**Check logs:**
```bash
docker logs haroti-web --tail 50
docker logs haroti-api --tail 50
docker logs haroti-postgres --tail 50
```

**Verify SSL certificates:**
```bash
ls -la /opt/haroti-lpg/ssl/
```

You should see:
- `fullchain.pem`
- `privkey.pem`

**Restart containers:**
```bash
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml restart
```

### CORS Errors

**Check CORS_ORIGIN setting:**
```bash
cat /opt/haroti-lpg/.env | grep CORS_ORIGIN
```

Should show: `CORS_ORIGIN=https://harotiholdingslimited.com`

If incorrect, fix it:
```bash
sudo nano /opt/haroti-lpg/.env
# Change CORS_ORIGIN to: https://harotiholdingslimited.com
```

Then restart API:
```bash
docker compose -f docker-compose.prod.yml restart api
```

## Regular Maintenance

### View Logs
```bash
cd /opt/haroti-lpg
docker logs haroti-api --tail 100 -f
```

### Backup Database
```bash
docker exec haroti-postgres pg_dump -U haroti haroti_lpg > backup-$(date +%Y%m%d).sql
```

### Update Application
```bash
cd /opt/haroti-lpg
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### Restart Services
```bash
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml restart
```

### Check Certificate Expiry
```bash
sudo certbot certificates
```

### Manual Certificate Renewal (if needed)
```bash
sudo certbot renew
sudo cp /etc/letsencrypt/live/harotiholdingslimited.com/fullchain.pem /opt/haroti-lpg/ssl/
sudo cp /etc/letsencrypt/live/harotiholdingslimited.com/privkey.pem /opt/haroti-lpg/ssl/
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml restart web
```

## Security Recommendations

1. **Change default admin password** immediately after first login
2. **Strong database password**: Ensure `.env` has a strong `DATABASE_PASSWORD`
3. **Strong JWT secret**: Ensure `.env` has a random `JWT_SECRET` (32+ characters)
4. **Regular backups**: Set up automated daily database backups
5. **System updates**: Keep server updated with `sudo apt update && sudo apt upgrade`
6. **Monitor logs**: Regularly check application logs for suspicious activity

## Quick Reference Commands

All commands assume you're in `/opt/haroti-lpg`:

```bash
# View status
docker compose -f docker-compose.prod.yml ps

# Restart all
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart web
docker compose -f docker-compose.prod.yml restart api

# View logs
docker logs haroti-web -f
docker logs haroti-api -f

# Stop everything
docker compose -f docker-compose.prod.yml down

# Start everything
docker compose -f docker-compose.prod.yml --env-file .env up -d

# Rebuild and restart
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# Database backup
docker exec haroti-postgres pg_dump -U haroti haroti_lpg > backup.sql

# Database restore
docker exec -i haroti-postgres psql -U haroti haroti_lpg < backup.sql
```

## Support

For additional help:
- See [Domain Setup Guide](./DOMAIN_SETUP.md) for general information
- See [Quick Start Guide](../QUICKSTART.md) for quick reference
- Check application logs for specific errors

---

**Summary:**
```bash
# On your VPS (169.58.127.129)
cd /opt/haroti-lpg
git pull origin cursor/domain-vps-setup-376b
sudo bash scripts/setup-ssl.sh harotiholdingslimited.com admin@harotiholdingslimited.com
sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable

# Then visit: https://harotiholdingslimited.com
```
