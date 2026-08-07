# 🚀 DEPLOY NOW - Quick Commands

## Step-by-Step Deployment

### 1️⃣ Connect to Your VPS

```bash
ssh root@169.58.127.129
```

### 2️⃣ Run the Deployment Script

```bash
# Download and run the deployment script
curl -fsSL https://raw.githubusercontent.com/peterchatuwa/haroti-lpg-management/cursor/domain-vps-setup-376b/scripts/deploy-to-vps.sh | bash
```

**OR** if you prefer to review first:

```bash
# Clone repository
cd /opt
git clone https://github.com/peterchatuwa/haroti-lpg-management.git haroti-lpg
cd haroti-lpg
git checkout cursor/domain-vps-setup-376b

# Run deployment
sudo bash scripts/deploy-to-vps.sh
```

### 3️⃣ Configure DNS Records

While the deployment runs, configure your DNS:

**REQUIRED RECORDS:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 169.58.127.129 | 3600 |
| CNAME | www | harotiholdingslimited.com | 3600 |

See `DNS_RECORDS.txt` for detailed instructions.

### 4️⃣ Wait for DNS Propagation

Check DNS propagation:
```bash
nslookup harotiholdingslimited.com
```

Or visit: https://www.whatsmydns.net/#A/harotiholdingslimited.com

Expected result: `169.58.127.129`

### 5️⃣ Test Your Deployment

Once DNS propagates:

**Corporate Website:**
- https://harotiholdingslimited.com

**Management System:**
- https://harotiholdingslimited.com/app
- Login: admin / Password123!

**API Documentation:**
- https://harotiholdingslimited.com/api/docs

### 6️⃣ Upload Your Logo

```bash
# From your computer
scp "C:\Users\peter\Downloads\Haroti Logo.jpg.jpeg" root@169.58.127.129:/opt/haroti-gas-website/public/haroti-logo.png

# Then rebuild website
ssh root@169.58.127.129
cd /opt/haroti-gas-website
npm run build
cp -r dist/* /opt/haroti-lpg/website-dist/
docker restart haroti-web
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Corporate website loads at harotiholdingslimited.com
- [ ] Logo displays correctly
- [ ] All 11 pages accessible
- [ ] Management system accessible at /app
- [ ] Can login with demo credentials
- [ ] API docs load at /api/docs
- [ ] SSL certificate valid (green padlock)
- [ ] Mobile responsive on phone

---

## 🐛 Troubleshooting

### Containers not running
```bash
docker ps
docker logs haroti-web
docker logs haroti-api
```

### Website not loading
```bash
# Check nginx config
docker exec haroti-web cat /etc/nginx/conf.d/default.conf

# Restart containers
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml restart
```

### SSL certificate issues
```bash
# Check certificates
ls -la /opt/haroti-lpg/ssl/

# Renew if needed
sudo certbot renew
```

---

## 📱 Access URLs

After deployment and DNS configuration:

| Service | URL |
|---------|-----|
| **Website** | https://harotiholdingslimited.com |
| **Admin App** | https://harotiholdingslimited.com/app |
| **API Docs** | https://harotiholdingslimited.com/api/docs |

---

## 🔒 Security

**IMPORTANT:** After first login, immediately:

1. Change admin password
2. Create additional user accounts
3. Set up database backups
4. Review `.env` file security

---

## 📞 Support

If you encounter issues:

1. Check logs: `docker logs haroti-web -f`
2. Review `FINAL_DEPLOYMENT_CHECKLIST.md`
3. Check `website/DEPLOYMENT_GUIDE.md`

---

**That's it! Your Haroti Gas system will be live! 🎉**
