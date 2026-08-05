# 🚀 Haroti Gas - Final Deployment Checklist

## Domain: harotiholdingslimited.com
## VPS: 169.58.127.129

---

## ✅ Pre-Deployment (Complete)

- [x] Website fully built (all 11 pages)
- [x] Logo integrated
- [x] Domain setup scripts created
- [x] SSL automation ready
- [x] Documentation complete
- [x] Code committed and pushed

---

## 📋 Deployment Steps

### Step 1: Create Separate Website Repository

**On your VPS or local machine:**

```bash
# Option A: Automated script
ssh root@169.58.127.129
cd /opt/haroti-lpg
bash scripts/create-website-repo.sh
```

**Option B: Manual steps:**

```bash
# 1. Create new repo on GitHub
Go to https://github.com/new
Name: haroti-gas-website
Description: Haroti Gas Corporate Website
Create repository

# 2. Extract and push
cd /opt
git clone https://github.com/peterchatuwa/haroti-lpg-management.git temp
cd temp
git checkout cursor/domain-vps-setup-376b
cp -r website /opt/haroti-gas-website
cd /opt/haroti-gas-website
rm -rf .git
git init
git add .
git commit -m "Initial commit: Haroti Gas Corporate Website"
git remote add origin https://github.com/peterchatuwa/haroti-gas-website.git
git branch -M main
git push -u origin main
cd /opt
rm -rf temp
```

### Step 2: Upload Actual Logo

```bash
# Upload your logo file to the server
scp "C:\Users\peter\Downloads\Haroti Logo.jpg.jpeg" root@169.58.127.129:/opt/haroti-gas-website/public/haroti-logo.png

# Or convert on server if needed
ssh root@169.58.127.129
cd /opt/haroti-gas-website/public
# Use ImageMagick or similar to convert/optimize
convert haroti-logo.jpg -resize 200x200 haroti-logo.png
```

### Step 3: Deploy LPG Management System

```bash
ssh root@169.58.127.129

# Clone main repository
cd /opt
git clone https://github.com/peterchatuwa/haroti-lpg-management.git haroti-lpg
cd haroti-lpg
git checkout cursor/domain-vps-setup-376b

# Configure environment
cp .env.production.example .env
nano .env

# Set these values:
# DATABASE_PASSWORD=<strong-random-password>
# JWT_SECRET=<long-random-string-32+chars>
# CORS_ORIGIN=https://harotiholdingslimited.com

# Run automated SSL setup
sudo bash scripts/setup-ssl.sh harotiholdingslimited.com admin@harotiholdingslimited.com

# Configure firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow OpenSSH
sudo ufw enable

# Verify deployment
docker compose -f docker-compose.prod.yml ps
docker logs haroti-api --tail 50
docker logs haroti-web --tail 50
```

### Step 4: Build and Deploy Website

```bash
# Build website
cd /opt/haroti-gas-website
npm install
npm run build

# Create website directory in main app
mkdir -p /opt/haroti-lpg/website
cp -r dist/* /opt/haroti-lpg/website/

# Update nginx configuration
nano /opt/haroti-lpg/frontend/nginx.conf
```

Add website routes to nginx:

```nginx
# Corporate Website (root)
location / {
    root /usr/share/nginx/html/website;
    try_files $uri $uri/ /index.html;
}

# Management App
location /app {
    alias /usr/share/nginx/html/admin;
    try_files $uri $uri/ /app/index.html;
}

# API (existing)
location /api/ {
    proxy_pass http://api:3000/api/;
    # ... existing proxy config
}
```

Update docker-compose.prod.yml volumes:

```yaml
web:
  # ... existing config
  volumes:
    - ./ssl:/etc/nginx/ssl:ro
    - ./website:/usr/share/nginx/html/website:ro
    - ./frontend/dist:/usr/share/nginx/html/admin:ro
```

Rebuild and restart:

```bash
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### Step 5: Verify Deployment

**Test all URLs:**

1. **Corporate Website**: https://harotiholdingslimited.com
   - [ ] Homepage loads with logo
   - [ ] All navigation works
   - [ ] All 11 pages accessible
   - [ ] Forms work (franchise, careers, contact)
   - [ ] Mobile responsive

2. **Management System**: https://harotiholdingslimited.com/app
   - [ ] Login page loads
   - [ ] Demo login works (admin / Password123!)
   - [ ] Dashboard accessible
   - [ ] All features functional

3. **API**: https://harotiholdingslimited.com/api/docs
   - [ ] Swagger docs load
   - [ ] API endpoints respond

4. **SSL Certificate**:
   - [ ] HTTPS works without warnings
   - [ ] Auto-renewal configured
   - [ ] Test at: https://www.ssllabs.com/ssltest/

**Check Logs:**

```bash
docker logs haroti-web --tail 100
docker logs haroti-api --tail 100
docker logs haroti-postgres --tail 100
```

### Step 6: Post-Deployment Configuration

**Change default passwords:**

```bash
# 1. Access management system
https://harotiholdingslimited.com/app
# Login: admin / Password123!
# Go to Settings → Change Password

# 2. Update database password if using default
# 3. Rotate JWT secret if needed
```

**Setup monitoring:**

```bash
# Add monitoring/alerting (optional)
# Setup backup automation
# Configure analytics
```

---

## 🔧 Maintenance Commands

### Update Website Content

```bash
cd /opt/haroti-gas-website
git pull origin main
npm run build
cp -r dist/* /opt/haroti-lpg/website/
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml restart web
```

### Update Management System

```bash
cd /opt/haroti-lpg
git pull origin main
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### Backup Database

```bash
docker exec haroti-postgres pg_dump -U haroti haroti_lpg > backup-$(date +%Y%m%d-%H%M%S).sql
```

### View Logs

```bash
docker logs haroti-web -f
docker logs haroti-api -f
docker logs haroti-postgres -f
```

### Restart Services

```bash
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml restart
```

---

## 📞 Testing Checklist

### Website Tests

- [ ] Homepage loads with Haroti Gas logo
- [ ] About Us page shows company information
- [ ] Products page displays LPG cylinders and PAYC info
- [ ] Find a Station shows all 8 stations with search
- [ ] Franchise form submits successfully
- [ ] Impact & ESG shows KPI metrics
- [ ] Investors page displays investment info
- [ ] News page shows articles
- [ ] Careers form works
- [ ] Contact form submits
- [ ] Privacy Policy and Terms load
- [ ] Mobile view works perfectly
- [ ] All images load (especially logo)

### Management System Tests

- [ ] Login page loads at /app
- [ ] Demo credentials work
- [ ] Dashboard shows statistics
- [ ] Stations page lists all 8 locations
- [ ] Sales/POS functionality works
- [ ] Inventory tracking works
- [ ] Reports generate correctly
- [ ] User management accessible

### Integration Tests

- [ ] Website links to management app work
- [ ] API accessible from website
- [ ] CORS configured correctly
- [ ] SSL certificate valid
- [ ] All subpaths work correctly

---

## 🐛 Troubleshooting

### Website not loading

```bash
# Check nginx
docker logs haroti-web

# Verify files
docker exec haroti-web ls -la /usr/share/nginx/html/website

# Check nginx config
docker exec haroti-web cat /etc/nginx/conf.d/default.conf
```

### Management app not accessible

```bash
# Check CORS
cat /opt/haroti-lpg/.env | grep CORS

# Should be: CORS_ORIGIN=https://harotiholdingslimited.com

# Restart API
docker compose -f docker-compose.prod.yml restart api
```

### SSL issues

```bash
# Check certificates
ls -la /opt/haroti-lpg/ssl/

# Renew manually
sudo certbot renew
sudo cp /etc/letsencrypt/live/harotiholdingslimited.com/* /opt/haroti-lpg/ssl/
docker compose -f docker-compose.prod.yml restart web
```

### Logo not showing

```bash
# Verify logo file exists
ls -la /opt/haroti-gas-website/public/haroti-logo.png
ls -la /opt/haroti-lpg/website/haroti-logo.png

# Rebuild if needed
cd /opt/haroti-gas-website
npm run build
cp -r dist/* /opt/haroti-lpg/website/
```

---

## 📂 Final Directory Structure

```
/opt/
├── haroti-lpg/                    # Main LPG Management System
│   ├── backend/                   # NestJS API
│   ├── frontend/                  # Admin React app
│   ├── website/                   # Corporate website (built files)
│   ├── ssl/                       # SSL certificates
│   ├── docker-compose.prod.yml
│   ├── scripts/setup-ssl.sh
│   └── .env
│
└── haroti-gas-website/            # Website source (separate repo)
    ├── src/                       # Source code
    ├── public/
    │   └── haroti-logo.png       # Your logo here!
    ├── dist/                      # Built files
    ├── DEPLOYMENT_GUIDE.md
    └── package.json
```

---

## ✅ Success Criteria

Deployment is successful when:

- [x] harotiholdingslimited.com loads with Haroti Gas branding
- [x] All 11 website pages accessible and functional
- [x] Logo displays correctly
- [x] Management system accessible at /app
- [x] SSL certificate valid and auto-renewing
- [x] All forms submit successfully
- [x] Mobile responsive across all pages
- [x] No console errors
- [x] Fast page loads (<2s)
- [x] Database backed up
- [x] Default passwords changed

---

## 📚 Documentation References

- **Website Documentation**: `/opt/haroti-gas-website/README_WEBSITE.md`
- **Deployment Guide**: `/opt/haroti-gas-website/DEPLOYMENT_GUIDE.md`
- **Domain Setup**: `/opt/haroti-lpg/docs/SETUP_harotiholdingslimited.com.md`
- **Command Reference**: `/opt/haroti-lpg/DEPLOYMENT_COMMANDS.txt`
- **Quick Start**: `/opt/haroti-lpg/QUICKSTART.md`

---

## 🎉 You're Ready!

Everything is prepared for deployment. Follow the steps above and you'll have:
- ✅ Corporate website at harotiholdingslimited.com
- ✅ Management system at harotiholdingslimited.com/app
- ✅ Secure HTTPS with auto-renewal
- ✅ Professional branding with your logo
- ✅ Fully integrated system

**Need help?** Check the documentation or review logs for specific issues.

---

**Last Updated**: August 5, 2026  
**Status**: Ready for Deployment ✅
