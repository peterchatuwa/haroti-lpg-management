# Haroti LPG Management - Quick Start Guide

## 🚀 Production Deployment with Domain

### Prerequisites
- ✅ VPS with public IP (Ubuntu/Debian recommended)
- ✅ Domain name with DNS access
- ✅ Root/sudo access to VPS

### Setup (5 minutes)

#### 1️⃣ Configure DNS
Create an A record pointing to your VPS IP:
```
Type: A
Name: lpg (or @)
Value: <your-vps-ip>
TTL: 3600
```

#### 2️⃣ SSH into VPS and run:
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repository
sudo mkdir -p /opt/haroti-lpg && cd /opt/haroti-lpg
sudo git clone https://github.com/peterchatuwa/haroti-lpg-management .

# Configure environment
sudo cp .env.production.example .env
sudo nano .env  # Set DATABASE_PASSWORD and JWT_SECRET

# Run automated SSL setup
sudo bash scripts/setup-ssl.sh lpg.yourdomain.com your@email.com

# Configure firewall
sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw allow OpenSSH
sudo ufw enable
```

#### 3️⃣ Access Your Application
- **Web UI**: https://lpg.yourdomain.com
- **API Docs**: https://lpg.yourdomain.com/api/docs
- **Demo Login**: `admin` / `Password123!`

### 📖 Detailed Guides

- **Full Domain Setup**: [docs/DOMAIN_SETUP.md](./docs/DOMAIN_SETUP.md)
- **Deployment Notes**: [README.DEPLOY.md](./README.DEPLOY.md)
- **Main Documentation**: [README.md](./README.md)

### 🔧 Common Operations

**View logs:**
```bash
cd /opt/haroti-lpg
docker logs haroti-api --tail 100
docker logs haroti-web --tail 100
```

**Restart application:**
```bash
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml restart
```

**Update application:**
```bash
cd /opt/haroti-lpg
sudo git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

**Backup database:**
```bash
docker exec haroti-postgres pg_dump -U haroti haroti_lpg > backup-$(date +%Y%m%d).sql
```

### 🐛 Troubleshooting

**Application not accessible:**
```bash
# Check containers
docker compose -f docker-compose.prod.yml ps

# Check logs
docker logs haroti-web
docker logs haroti-api
```

**SSL certificate issues:**
```bash
# Test renewal
sudo certbot renew --dry-run

# Check certificates
ls -la /opt/haroti-lpg/ssl/
```

**CORS errors:**
```bash
# Verify CORS_ORIGIN in .env
cat /opt/haroti-lpg/.env | grep CORS_ORIGIN

# Should match: CORS_ORIGIN=https://yourdomain.com
```

### 💻 Local Development

For local development without Docker:

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

See [README.md](./README.md) for complete development setup.

### 🔒 Security Checklist

- ✅ Set strong `DATABASE_PASSWORD` in `.env`
- ✅ Set random `JWT_SECRET` (32+ characters) in `.env`
- ✅ Configure firewall (ports 80, 443, 22)
- ✅ Enable automatic system updates
- ✅ Regular database backups
- ✅ SSL certificates auto-renew (Let's Encrypt)

### 📞 Support

For issues or questions, check:
1. [Troubleshooting section in DOMAIN_SETUP.md](./docs/DOMAIN_SETUP.md#troubleshooting)
2. Application logs: `docker logs haroti-api` and `docker logs haroti-web`
3. SSL test: https://www.ssllabs.com/ssltest/

---

**Need help?** Review the detailed guides linked above or check the application logs for specific error messages.
