# 🔍 Troubleshooting: Can't Reach Site

## Current Status:

✅ **DNS:** Working correctly - harotiholdingslimited.com → 169.58.127.129  
✅ **VPS:** Online and reachable  
✅ **Nginx:** Running on port 80  
❌ **Haroti Deployment:** NOT YET DEPLOYED

## The Issue:

Your VPS has nginx running, but the **Haroti Gas application hasn't been deployed yet**.

---

## 🚀 Solution: Deploy Now

You need to SSH into your VPS and run the deployment script.

### Option 1: Quick One-Command Deploy (Recommended)

```bash
# SSH into VPS
ssh root@169.58.127.129

# Run deployment script directly from GitHub
curl -fsSL https://raw.githubusercontent.com/peterchatuwa/haroti-lpg-management/cursor/domain-vps-setup-376b/scripts/deploy-to-vps.sh | sudo bash
```

### Option 2: Manual Step-by-Step

```bash
# 1. SSH into VPS
ssh root@169.58.127.129

# 2. Clone repository
cd /opt
git clone https://github.com/peterchatuwa/haroti-lpg-management.git haroti-lpg
cd haroti-lpg
git checkout cursor/domain-vps-setup-376b

# 3. Run deployment
sudo bash scripts/deploy-to-vps.sh
```

---

## 📋 What the Deployment Will Do:

1. ✅ Install Docker and Node.js (if not present)
2. ✅ Clone your Haroti Gas code
3. ✅ Build the corporate website
4. ✅ Configure environment variables
5. ✅ Set up SSL certificates (Let's Encrypt)
6. ✅ Configure nginx for both website and app
7. ✅ Start Docker containers
8. ✅ Configure firewall

**Time:** ~5-10 minutes

---

## 🔍 Quick Checks Before Deploying

Connect to your VPS and check current state:

```bash
ssh root@169.58.127.129

# Check if Haroti is already there
ls -la /opt/haroti-lpg

# Check running Docker containers
docker ps

# Check what nginx is serving
curl localhost
```

---

## After Deployment

Once the script completes, you'll see:

```
✓ DEPLOYMENT COMPLETE!

URLs (after DNS is configured):
  • Corporate Website: https://harotiholdingslimited.com
  • Management System: https://harotiholdingslimited.com/app
  • API Documentation: https://harotiholdingslimited.com/api/docs
```

Then test:
- http://harotiholdingslimited.com (will redirect to https)
- https://harotiholdingslimited.com (corporate website)
- https://harotiholdingslimited.com/app (management system)

---

## ⚠️ Common Issues

### Can't SSH to VPS
```bash
# Make sure you have the SSH key or password
ssh root@169.58.127.129

# If using SSH key:
ssh -i /path/to/your/key.pem root@169.58.127.129
```

### Port 443 (HTTPS) Not Open
The deployment script will:
- Open ports 80 and 443 in firewall
- Set up SSL certificates
- Configure nginx for HTTPS

### SSL Certificate Issues
If Let's Encrypt fails initially:
```bash
# The script will set up self-signed certs as fallback
# You can retry Let's Encrypt after DNS fully propagates:
cd /opt/haroti-lpg
sudo bash scripts/setup-ssl.sh harotiholdingslimited.com your-email@example.com
```

---

## 🎯 Next Steps

1. **SSH into VPS**: `ssh root@169.58.127.129`
2. **Run deployment**: Copy and paste the one-command deploy
3. **Wait 5-10 minutes** for deployment to complete
4. **Test the site**: Visit https://harotiholdingslimited.com
5. **Login to admin**: Visit https://harotiholdingslimited.com/app

---

## 📞 Still Having Issues?

If deployment fails, check:

```bash
# View deployment logs
cat /var/log/haroti-deploy.log

# Check Docker containers
docker ps -a

# Check nginx logs
docker logs haroti-web

# Check API logs
docker logs haroti-api
```

Send me any error messages and I'll help troubleshoot!

---

## Summary

**Current State:** VPS is online but Haroti not deployed  
**Action Needed:** Run the deployment script  
**Time Required:** 5-10 minutes  
**Result:** Full website + management system live at your domain
