# 🔄 Website Update Guide

Complete guide for updating your Haroti Gas website content.

---

## 🎯 **Quick Update (Easiest Method)**

### One-Command Update

```bash
# SSH into VPS
ssh root@169.58.127.129

# Run update script
bash /opt/haroti-lpg/scripts/update-website.sh
```

That's it! The script will:
1. ✅ Pull latest changes from GitHub
2. ✅ Rebuild the website
3. ✅ Deploy to live server
4. ✅ Restart services

**Time:** ~30 seconds

---

## 📝 **What Can You Update?**

### Content Updates
- ✅ Text on any page
- ✅ Company information
- ✅ Contact details
- ✅ Station locations
- ✅ News articles
- ✅ Job listings
- ✅ Product information

### Design Updates
- ✅ Colors and styling
- ✅ Logo
- ✅ Images
- ✅ Fonts
- ✅ Layout

### Feature Updates
- ✅ Add new pages
- ✅ Add new sections
- ✅ Update forms
- ✅ Modify navigation

---

## 📂 **Where to Find Files**

### On VPS
```
/opt/haroti-lpg/website/
├── src/
│   ├── pages/              # All page content
│   │   ├── HomePage.tsx    # Homepage
│   │   ├── AboutPage.tsx   # About Us page
│   │   ├── ProductsPage.tsx # Products page
│   │   └── ...            # Other pages
│   ├── components/         # Reusable components
│   │   ├── layout/
│   │   │   ├── Header.tsx  # Header (logo, nav, contact)
│   │   │   └── Footer.tsx  # Footer
│   │   └── forms/          # Form components
│   └── data/               # Content data files
│       ├── stations.ts     # Station information
│       └── news.ts         # News articles
├── public/                 # Static files
│   └── haroti-logo.svg    # Logo file
└── tailwind.config.js     # Styling configuration
```

---

## 🛠️ **Common Update Tasks**

### 1. Update Homepage Text

```bash
ssh root@169.58.127.129
cd /opt/haroti-lpg/website/src/pages
nano HomePage.tsx

# Find and edit the text you want to change
# Press Ctrl+X, then Y, then Enter to save

# Run update script
bash /opt/haroti-lpg/scripts/update-website.sh
```

### 2. Update Contact Information

```bash
ssh root@169.58.127.129
cd /opt/haroti-lpg/website/src/components/layout

# Update phone/email in header
nano Header.tsx

# Update footer contact info
nano Footer.tsx

# Deploy changes
bash /opt/haroti-lpg/scripts/update-website.sh
```

### 3. Add New Station

```bash
ssh root@169.58.127.129
cd /opt/haroti-lpg/website/src/data
nano stations.ts

# Add new station entry like this:
# {
#   id: 9,
#   name: 'New Station Name',
#   location: 'Location, City',
#   address: 'Full Address',
#   phone: '+265 XXX XXX XXX',
#   hours: 'Mon-Fri: 7AM-7PM, Sat-Sun: 8AM-6PM',
#   coordinates: { lat: -XX.XXXX, lng: XX.XXXX },
# },

# Save and deploy
bash /opt/haroti-lpg/scripts/update-website.sh
```

### 4. Add News Article

```bash
ssh root@169.58.127.129
cd /opt/haroti-lpg/website/src/data
nano news.ts

# Add new article at the top of the array
# {
#   id: 'new-article',
#   title: 'Your Article Title',
#   excerpt: 'Brief summary...',
#   content: 'Full article content...',
#   image: '/path/to/image.jpg',
#   category: 'News',
#   date: '2026-08-06',
#   author: 'Haroti Gas Team',
# },

# Save and deploy
bash /opt/haroti-lpg/scripts/update-website.sh
```

### 5. Update Company Logo

```bash
# From your computer, upload new logo
scp your-logo.png root@169.58.127.129:/opt/haroti-lpg/website/public/haroti-logo.png

# Or for SVG
scp your-logo.svg root@169.58.127.129:/opt/haroti-lpg/website/public/haroti-logo.svg

# SSH and deploy
ssh root@169.58.127.129
bash /opt/haroti-lpg/scripts/update-website.sh
```

### 6. Change Colors

```bash
ssh root@169.58.127.129
cd /opt/haroti-lpg/website
nano tailwind.config.js

# Update color values:
# colors: {
#   'haroti-blue': '#YOUR_BLUE_COLOR',
#   'haroti-orange': '#YOUR_ORANGE_COLOR',
#   'haroti-green': '#YOUR_GREEN_COLOR',
# },

# Save and deploy
bash /opt/haroti-lpg/scripts/update-website.sh
```

---

## 💻 **Development Workflow (For Major Changes)**

If you want to test changes before deploying:

### 1. Setup Local Development

```bash
# On your computer
git clone https://github.com/peterchatuwa/haroti-lpg-management.git
cd haroti-lpg-management
git checkout cursor/domain-vps-setup-376b
cd website

# Install dependencies
npm install

# Start development server
npm run dev
```

Opens at: http://localhost:5173

### 2. Make Changes

Edit files in `website/src/` folder

### 3. Test Locally

Changes appear instantly in your browser

### 4. Push to GitHub

```bash
git add .
git commit -m "Description of changes"
git push origin cursor/domain-vps-setup-376b
```

### 5. Deploy to VPS

```bash
ssh root@169.58.127.129
bash /opt/haroti-lpg/scripts/update-website.sh
```

---

## 🚨 **Emergency Rollback**

If an update breaks something:

```bash
ssh root@169.58.127.129
cd /opt/haroti-lpg

# Go back to previous version
git log --oneline  # See recent commits
git checkout <previous-commit-hash>

# Rebuild
bash /opt/haroti-lpg/scripts/update-website.sh
```

Or restore from backup:

```bash
# If you have a backup
cp -r /backup/website-dist /opt/haroti-lpg/website-dist
docker restart haroti-web
```

---

## 📋 **Update Checklist**

Before deploying updates:

- [ ] Test changes locally (if possible)
- [ ] Commit changes to GitHub
- [ ] SSH into VPS
- [ ] Run update script
- [ ] Clear browser cache
- [ ] Verify changes on live site
- [ ] Test on mobile device
- [ ] Check all links work
- [ ] Verify forms still work

---

## ⏰ **Automated Updates (Optional)**

You can set up automatic updates:

```bash
# Create cron job to check for updates daily
ssh root@169.58.127.129
crontab -e

# Add this line to check for updates at 2 AM daily:
0 2 * * * cd /opt/haroti-lpg && git pull origin cursor/domain-vps-setup-376b && bash scripts/update-website.sh >> /var/log/website-updates.log 2>&1
```

---

## 🆘 **Troubleshooting**

### Changes not showing?

1. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Delete
   - Firefox: Ctrl+Shift+Del
   
2. **Hard refresh:**
   - Windows/Linux: Ctrl+F5
   - Mac: Cmd+Shift+R

3. **Try incognito mode**

4. **Check if deployment worked:**
   ```bash
   ssh root@169.58.127.129
   docker ps  # All containers should be "Up"
   docker logs haroti-web  # Check for errors
   ```

### Build failed?

```bash
ssh root@169.58.127.129
cd /opt/haroti-lpg/website

# Check for errors
npm run build

# If there are syntax errors, fix them and try again
```

### Website down?

```bash
ssh root@169.58.127.129

# Check containers
docker ps

# Restart if needed
docker restart haroti-web

# Or restart everything
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml restart
```

---

## 📞 **Need Help?**

### Quick Reference Commands

```bash
# Update website
bash /opt/haroti-lpg/scripts/update-website.sh

# Check logs
docker logs haroti-web -f

# Restart services
docker restart haroti-web

# Check status
docker ps
```

### File Locations

- **Source code:** `/opt/haroti-lpg/website/src/`
- **Logo:** `/opt/haroti-lpg/website/public/haroti-logo.svg`
- **Built website:** `/opt/haroti-lpg/website-dist/`
- **Update script:** `/opt/haroti-lpg/scripts/update-website.sh`

---

## 🎓 **Learning Resources**

### React & TypeScript
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Tailwind CSS
- [Tailwind Documentation](https://tailwindcss.com/docs)

### Vite
- [Vite Guide](https://vitejs.dev/guide/)

---

## ✅ **Best Practices**

1. **Always test locally** before deploying major changes
2. **Commit to GitHub** to track changes
3. **Clear cache** after updates to see changes
4. **Backup** important data before major updates
5. **Document** your changes in commit messages
6. **Test on mobile** after updates
7. **Keep dependencies updated** regularly

---

## 📈 **Update Frequency**

Recommended update schedule:

| Type | Frequency |
|------|-----------|
| **Content updates** (news, etc.) | As needed |
| **Security patches** | Monthly |
| **Feature updates** | Quarterly |
| **Dependency updates** | Monthly |
| **Backup verification** | Weekly |

---

*For more help, check the other documentation files or contact your developer.*

**Last Updated:** August 6, 2026
