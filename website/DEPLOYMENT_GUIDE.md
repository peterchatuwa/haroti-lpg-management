# Haroti Gas Website - Deployment Guide

## Setup for harotiholdingslimited.com

This guide covers deploying both the **corporate website** and **LPG management application** on the same VPS server.

## Architecture Overview

```
harotiholdingslimited.com (VPS: 169.58.127.129)
│
├── / (root)                    → Corporate Website (React)
├── /app or /admin              → LPG Management System (NestJS + React)
├── /api                        → Backend API
└── /api/docs                   → Swagger Documentation
```

## Prerequisites

- VPS with Docker installed
- Domain: harotiholdingslimited.com pointing to 169.58.127.129
- SSL certificates (via Let's Encrypt)

## Step 1: Create Separate GitHub Repository for Website

```bash
# On your local machine or VPS
cd /opt
git clone https://github.com/peterchatuwa/haroti-lpg-management.git haroti-temp
cd haroti-temp
git checkout cursor/domain-vps-setup-376b

# Extract website folder
cp -r website /opt/haroti-gas-website
cd /opt/haroti-gas-website

# Initialize new repository
rm -rf .git
git init
git add .
git commit -m "Initial commit: Haroti Gas Corporate Website"

# Create new repo on GitHub: haroti-gas-website
git remote add origin https://github.com/peterchatuwa/haroti-gas-website.git
git branch -M main
git push -u origin main

# Clean up temp folder
cd /opt
rm -rf haroti-temp
```

## Step 2: Deploy LPG Management System

```bash
# Clone main application
cd /opt
git clone https://github.com/peterchatuwa/haroti-lpg-management.git haroti-lpg
cd haroti-lpg
git checkout cursor/domain-vps-setup-376b

# Setup environment
cp .env.production.example .env
nano .env  # Set DATABASE_PASSWORD and JWT_SECRET

# Run SSL setup
sudo bash scripts/setup-ssl.sh harotiholdingslimited.com admin@harotiholdingslimited.com

# Configure firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow OpenSSH
sudo ufw enable
```

## Step 3: Deploy Corporate Website

### Option A: Same Server (Recommended)

Update nginx configuration to serve both:

```nginx
# /opt/haroti-lpg/frontend/nginx.conf

server {
  listen 443 ssl http2;
  server_name harotiholdingslimited.com;
  
  ssl_certificate /etc/nginx/ssl/fullchain.pem;
  ssl_certificate_key /etc/nginx/ssl/privkey.pem;

  # Corporate Website (root)
  location / {
    root /usr/share/nginx/html/website;
    try_files $uri $uri/ /index.html;
  }

  # LPG Management App
  location /app {
    alias /usr/share/nginx/html/admin;
    try_files $uri $uri/ /app/index.html;
  }

  # API Backend
  location /api/ {
    proxy_pass http://api:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Update `docker-compose.prod.yml`:

```yaml
  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    container_name: haroti-web
    restart: unless-stopped
    depends_on:
      - api
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
      - ./website/dist:/usr/share/nginx/html/website:ro
      - ./frontend/dist:/usr/share/nginx/html/admin:ro
    networks:
      - haroti_net
```

Build and deploy:

```bash
# Build website
cd /opt/haroti-gas-website
npm install
npm run build

# Copy to LPG management for serving
cp -r dist /opt/haroti-lpg/website/

# Rebuild and restart
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### Option B: Separate Subdomain

Use `www.harotiholdingslimited.com` or `portal.harotiholdingslimited.com` for the management app:

```nginx
# Website on root domain
server {
  listen 443 ssl http2;
  server_name harotiholdingslimited.com;
  root /usr/share/nginx/html/website;
  # ... SSL config ...
  location / {
    try_files $uri $uri/ /index.html;
  }
  location /api/ {
    proxy_pass http://api:3000/api/;
  }
}

# Management app on subdomain
server {
  listen 443 ssl http2;
  server_name portal.harotiholdingslimited.com;
  root /usr/share/nginx/html/admin;
  # ... SSL config ...
  location / {
    try_files $uri $uri/ /index.html;
  }
  location /api/ {
    proxy_pass http://api:3000/api/;
  }
}
```

## Step 4: Link Website to Management System

### Update Website Environment

Create `/opt/haroti-gas-website/.env.production`:

```env
VITE_API_URL=https://harotiholdingslimited.com/api
VITE_APP_URL=https://harotiholdingslimited.com/app
VITE_ADMIN_LOGIN_URL=https://harotiholdingslimited.com/app
```

### Update Management App URLs

Update `/opt/haroti-lpg/.env`:

```env
CORS_ORIGIN=https://harotiholdingslimited.com
PUBLIC_URL=https://harotiholdingslimited.com/app
```

### Add Login Link to Website Header

The website already includes a link structure. Update if needed:

```typescript
// website/src/components/layout/Header.tsx
<Link to="/app" className="text-sm text-haroti-blue hover:text-haroti-orange">
  Staff Login
</Link>
```

## Step 5: Complete Deployment

```bash
# On VPS
cd /opt/haroti-lpg

# Pull latest changes
git pull origin cursor/domain-vps-setup-376b

# Build website
cd /opt/haroti-gas-website
git pull origin main
npm install
npm run build
cp -r dist /opt/haroti-lpg/website/

# Restart services
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml --env-file .env down
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## Step 6: Verify Deployment

### Test URLs

1. **Corporate Website**: https://harotiholdingslimited.com
   - Should show the homepage with logo
   - All pages accessible
   - Forms functional

2. **Management App**: https://harotiholdingslimited.com/app
   - Should redirect to login
   - Use demo: admin / Password123!

3. **API**: https://harotiholdingslimited.com/api/docs
   - Swagger documentation

4. **SSL**: Check https://www.ssllabs.com/ssltest/analyze.html?d=harotiholdingslimited.com

### Check Logs

```bash
docker logs haroti-web --tail 100
docker logs haroti-api --tail 100
docker logs haroti-postgres --tail 100
```

## Maintenance

### Update Website Content

```bash
cd /opt/haroti-gas-website
git pull origin main
npm run build
cp -r dist /opt/haroti-lpg/website/
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml restart web
```

### Update Management System

```bash
cd /opt/haroti-lpg
git pull origin main  # or cursor/domain-vps-setup-376b
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### Backup Database

```bash
docker exec haroti-postgres pg_dump -U haroti haroti_lpg > backup-$(date +%Y%m%d).sql
```

## Troubleshooting

### Website not loading
```bash
# Check nginx is running
docker ps
docker logs haroti-web

# Verify files are copied
docker exec haroti-web ls -la /usr/share/nginx/html/website
```

### API not accessible from website
```bash
# Check CORS settings
cat /opt/haroti-lpg/.env | grep CORS_ORIGIN
# Should be: CORS_ORIGIN=https://harotiholdingslimited.com

# Restart API
docker compose -f docker-compose.prod.yml restart api
```

### SSL Certificate Issues
```bash
# Check certificates
ls -la /opt/haroti-lpg/ssl/

# Manually renew
sudo certbot renew
sudo cp /etc/letsencrypt/live/harotiholdingslimited.com/fullchain.pem /opt/haroti-lpg/ssl/
sudo cp /etc/letsencrypt/live/harotiholdingslimited.com/privkey.pem /opt/haroti-lpg/ssl/
docker compose -f docker-compose.prod.yml restart web
```

## Directory Structure on Server

```
/opt/
├── haroti-lpg/                 # Main LPG Management System
│   ├── backend/               # NestJS API
│   ├── frontend/              # Admin React app
│   ├── website/               # Corporate website (built files)
│   ├── ssl/                   # SSL certificates
│   ├── docker-compose.prod.yml
│   └── .env
│
└── haroti-gas-website/        # Website source (separate repo)
    ├── src/
    ├── public/
    ├── dist/                  # Built files (copied to haroti-lpg/website/)
    └── package.json
```

## Security Checklist

- [ ] SSL certificates installed and auto-renewing
- [ ] Strong DATABASE_PASSWORD in .env
- [ ] Strong JWT_SECRET in .env
- [ ] Firewall configured (ports 80, 443, 22 only)
- [ ] Regular backups scheduled
- [ ] CORS properly configured
- [ ] Admin area password changed from default

## Performance Optimization

- [ ] Gzip compression enabled (nginx)
- [ ] Static assets cached
- [ ] Database connection pooling
- [ ] CDN for static assets (optional)
- [ ] Image optimization

## Support

For issues:
1. Check logs: `docker logs haroti-web` and `docker logs haroti-api`
2. Verify configuration files
3. Review this deployment guide
4. Check PROJECT_STATUS.md and README_WEBSITE.md

---

**Deployment Status**: Ready for production ✅  
**Last Updated**: August 5, 2026
