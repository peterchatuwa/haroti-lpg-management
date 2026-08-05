# Domain Setup Guide for Haroti LPG Management

This guide walks you through setting up a custom domain with SSL/HTTPS for your Haroti LPG deployment on a VPS.

## Prerequisites

- A VPS with a public IP address
- A domain name (e.g., `lpg.yourdomain.com`)
- Root/sudo access to the VPS
- Docker installed on the VPS

## Overview

The setup process involves:
1. Configuring DNS records
2. Deploying the application
3. Obtaining SSL certificates from Let's Encrypt
4. Configuring nginx with SSL

## Step 1: Configure DNS

Point your domain to your VPS IP address by creating an A record:

```
Type: A
Name: @ (or your subdomain, e.g., lpg)
Value: <your-vps-ip-address>
TTL: 3600 (or automatic)
```

**Example for subdomain:**
- If your domain is `example.com` and you want `lpg.example.com`:
  - Type: A
  - Name: lpg
  - Value: 169.58.127.129 (your VPS IP)

**Wait for DNS propagation** (can take 5 minutes to 48 hours, usually within 1 hour).

Verify DNS propagation:
```bash
# On your local machine
nslookup lpg.example.com
# or
dig lpg.example.com +short
```

## Step 2: Initial Deployment

SSH into your VPS and deploy the application:

```bash
# Install Docker if not already installed
curl -fsSL https://get.docker.com | sh

# Create application directory
sudo mkdir -p /opt/haroti-lpg
cd /opt/haroti-lpg

# Clone the repository
sudo git clone https://github.com/peterchatuwa/haroti-lpg-management .

# Create environment file
sudo cp .env.production.example .env

# Edit .env and set secure passwords
sudo nano .env
```

**Important:** In `.env`, set:
- `DATABASE_PASSWORD` - A strong, random password
- `JWT_SECRET` - A long random string (at least 32 characters)
- `CORS_ORIGIN` - Will be updated by the SSL script, but you can set it to `https://yourdomain.com`

## Step 3: Run SSL Setup Script

The automated SSL setup script will:
- Install certbot
- Obtain SSL certificates from Let's Encrypt
- Configure nginx with your domain
- Set up automatic certificate renewal
- Update CORS settings
- Restart the application with SSL

Run the script:

```bash
cd /opt/haroti-lpg
sudo bash scripts/setup-ssl.sh lpg.example.com admin@example.com
```

Replace:
- `lpg.example.com` with your actual domain
- `admin@example.com` with your email (for Let's Encrypt notifications)

The script will:
1. Stop the application temporarily
2. Obtain SSL certificates
3. Configure nginx with SSL
4. Restart with HTTPS enabled

## Step 4: Configure Firewall

Ensure your firewall allows HTTP and HTTPS traffic:

```bash
# Using ufw (Ubuntu/Debian)
sudo ufw allow 80/tcp    # HTTP (for Let's Encrypt renewal)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow OpenSSH   # Don't lock yourself out!
sudo ufw enable
```

If using a cloud provider (AWS, DigitalOcean, etc.), also configure security groups/firewall rules in your cloud console.

## Step 5: Verify Installation

1. **Check DNS**: Ensure your domain resolves to your VPS IP
   ```bash
   nslookup lpg.example.com
   ```

2. **Check containers**: Ensure all containers are running
   ```bash
   cd /opt/haroti-lpg
   docker compose -f docker-compose.prod.yml ps
   ```

3. **Test HTTPS**: Visit `https://yourdomain.com` in your browser
   - You should see the login page
   - The browser should show a padlock icon (secure connection)

4. **Test API**: Visit `https://yourdomain.com/api/docs`
   - Should show the Swagger documentation

5. **Check SSL grade**: Test your SSL configuration at [SSL Labs](https://www.ssllabs.com/ssltest/)

## Troubleshooting

### Certificate Obtainment Fails

**Problem**: Certbot cannot obtain certificate

**Solutions**:
1. Verify DNS is correctly configured and propagated
2. Ensure ports 80 and 443 are open in firewall
3. Check if another service is using port 80:
   ```bash
   sudo netstat -tulpn | grep :80
   ```
4. Manually test certificate obtainment:
   ```bash
   sudo certbot certonly --standalone --test-cert -d yourdomain.com
   ```

### Application Not Accessible

**Problem**: Cannot access application via domain

**Solutions**:
1. Check if containers are running:
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```
2. Check nginx logs:
   ```bash
   docker logs haroti-web
   ```
3. Check API logs:
   ```bash
   docker logs haroti-api
   ```
4. Verify SSL certificates are mounted:
   ```bash
   ls -la /opt/haroti-lpg/ssl/
   ```

### CORS Errors

**Problem**: Browser shows CORS errors

**Solutions**:
1. Verify `.env` has correct `CORS_ORIGIN`:
   ```bash
   cat /opt/haroti-lpg/.env | grep CORS_ORIGIN
   ```
   Should be: `CORS_ORIGIN=https://yourdomain.com`

2. Restart the API container:
   ```bash
   cd /opt/haroti-lpg
   docker compose -f docker-compose.prod.yml restart api
   ```

### SSL Certificate Renewal Issues

Certificates auto-renew via cron. To manually test renewal:

```bash
sudo certbot renew --dry-run
```

To manually renew and update:

```bash
sudo certbot renew
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/haroti-lpg/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/haroti-lpg/ssl/
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml restart web
```

## Manual SSL Setup (Alternative)

If the automated script doesn't work for your setup, you can configure SSL manually:

### 1. Obtain Certificate

```bash
sudo certbot certonly --standalone -d yourdomain.com --email your@email.com
```

### 2. Copy Certificates

```bash
sudo mkdir -p /opt/haroti-lpg/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/haroti-lpg/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/haroti-lpg/ssl/
sudo chmod 644 /opt/haroti-lpg/ssl/fullchain.pem
sudo chmod 600 /opt/haroti-lpg/ssl/privkey.pem
```

### 3. Update nginx Configuration

```bash
cd /opt/haroti-lpg
sudo sed "s/\${DOMAIN_NAME}/yourdomain.com/g" frontend/nginx.conf.template > frontend/nginx.conf
```

### 4. Update .env

```bash
sudo nano /opt/haroti-lpg/.env
# Change CORS_ORIGIN=https://yourdomain.com
```

### 5. Restart Application

```bash
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### 6. Setup Auto-renewal

```bash
sudo crontab -e
# Add this line:
0 3 * * * certbot renew --quiet --deploy-hook 'cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/haroti-lpg/ssl/ && cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/haroti-lpg/ssl/ && cd /opt/haroti-lpg && docker compose -f docker-compose.prod.yml restart web'
```

## Updating the Application

When pulling updates from git:

```bash
cd /opt/haroti-lpg
sudo git pull
sudo docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

SSL configuration and certificates persist across updates.

## Security Recommendations

1. **Keep system updated**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use strong passwords**: Ensure `.env` has strong `DATABASE_PASSWORD` and `JWT_SECRET`

3. **Regular backups**: Backup the database regularly:
   ```bash
   docker exec haroti-postgres pg_dump -U haroti haroti_lpg > backup.sql
   ```

4. **Monitor certificates**: Let's Encrypt certificates expire after 90 days. Auto-renewal should handle this, but monitor `/var/log/letsencrypt/letsencrypt.log`

5. **Review logs**: Regularly check application logs for issues:
   ```bash
   docker logs haroti-api --tail 100
   docker logs haroti-web --tail 100
   ```

## Support

For issues or questions:
- Check the [main README](../README.md)
- Review [deployment notes](../README.DEPLOY.md)
- Check application logs

---

**Quick Setup Summary**:
```bash
# 1. Configure DNS A record pointing to your VPS
# 2. SSH into VPS
sudo mkdir -p /opt/haroti-lpg && cd /opt/haroti-lpg
sudo git clone https://github.com/peterchatuwa/haroti-lpg-management .
sudo cp .env.production.example .env
sudo nano .env  # Set strong passwords
# 3. Run SSL setup
sudo bash scripts/setup-ssl.sh lpg.example.com admin@example.com
# 4. Configure firewall
sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw allow OpenSSH && sudo ufw enable
# 5. Visit https://lpg.example.com
```
