# 🚀 Quick Reference Card - Haroti Gas Website

---

## 🌐 **Live URLs**

| Service | URL |
|---------|-----|
| **Website** | https://harotiholdingslimited.com |
| **Admin** | https://harotiholdingslimited.com/admin/ |
| **Admin Alt** | https://harotiholdingslimited.com/app/ |

**Admin Login:** `admin` / `Password123!`

---

## 🔄 **Update Website (Easiest Way)**

```bash
ssh root@169.58.127.129
bash /opt/haroti-lpg/scripts/update-website.sh
```

**Done!** Changes are live in ~30 seconds.

---

## 📝 **Common Updates**

### Update Homepage Text
```bash
ssh root@169.58.127.129
nano /opt/haroti-lpg/website/src/pages/HomePage.tsx
bash /opt/haroti-lpg/scripts/update-website.sh
```

### Update Contact Info
```bash
ssh root@169.58.127.129
nano /opt/haroti-lpg/website/src/components/layout/Header.tsx
bash /opt/haroti-lpg/scripts/update-website.sh
```

### Add Station
```bash
ssh root@169.58.127.129
nano /opt/haroti-lpg/website/src/data/stations.ts
bash /opt/haroti-lpg/scripts/update-website.sh
```

### Add News Article
```bash
ssh root@169.58.127.129
nano /opt/haroti-lpg/website/src/data/news.ts
bash /opt/haroti-lpg/scripts/update-website.sh
```

---

## 🔧 **Maintenance Commands**

```bash
# View logs
ssh root@169.58.127.129
docker logs haroti-web -f

# Restart services
docker restart haroti-web

# Check status
docker ps

# Update SSL certificate
certbot renew
docker restart haroti-web
```

---

## 📂 **File Locations**

```
/opt/haroti-lpg/
├── website/src/
│   ├── pages/           # Page content
│   ├── components/      # Reusable parts
│   └── data/           # Content data
├── website/public/
│   └── haroti-logo.svg # Logo file
└── scripts/
    └── update-website.sh # Update script
```

---

## 🐛 **Quick Fixes**

### Website Not Loading?
```bash
ssh root@169.58.127.129
docker restart haroti-web
```

### Changes Not Showing?
```
Clear browser cache: Ctrl+Shift+Delete
Hard refresh: Ctrl+F5
Try incognito mode
```

### Build Error?
```bash
ssh root@169.58.127.129
cd /opt/haroti-lpg/website
npm install
npm run build
```

---

## 📞 **VPS Access**

```
IP: 169.58.127.129
User: root
Password: Malawi12
```

```bash
ssh root@169.58.127.129
```

---

## 📚 **Documentation Files**

- `WEBSITE_UPDATE_GUIDE.md` - Full update guide
- `FINAL_STATUS.md` - System status
- `DEPLOYMENT_SUCCESS.md` - Deployment details
- `ADMIN_ACCESS.md` - Admin system guide
- `LOGO_UPDATE_GUIDE.md` - Logo instructions

---

## ⚡ **Emergency Commands**

```bash
# Restart everything
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml restart

# Check logs for errors
docker logs haroti-web --tail 50

# Rollback to previous version
git log --oneline
git checkout <previous-commit>
bash scripts/update-website.sh
```

---

## ✅ **Daily Checklist**

- [ ] Website loads: https://harotiholdingslimited.com
- [ ] Admin works: https://harotiholdingslimited.com/admin/
- [ ] SSL valid (green padlock 🔒)
- [ ] All pages accessible
- [ ] Forms work

---

## 🎯 **Most Used Commands**

```bash
# 1. Update website
ssh root@169.58.127.129
bash /opt/haroti-lpg/scripts/update-website.sh

# 2. View logs
docker logs haroti-web -f

# 3. Restart
docker restart haroti-web

# 4. Check status
docker ps
```

---

**That's it!** Keep this reference handy for quick access.

*For detailed guides, see `WEBSITE_UPDATE_GUIDE.md`*
