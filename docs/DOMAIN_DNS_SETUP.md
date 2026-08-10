# Domain and DNS Configuration Guide

## Problem Diagnosis

As of August 10, 2026, the following domains are **not accessible** due to missing DNS configuration:

- `harotilimited.com` - **NXDOMAIN** (domain does not exist in DNS)
- `harotilimited.mw` - **NXDOMAIN** (domain does not exist in DNS)  
- `lpg.aircargo.mw` - **NXDOMAIN** (domain does not exist in DNS)

### Current Status

✅ **Server is operational**: `http://169.58.127.129/` is accessible and returning HTTP 200 OK  
❌ **DNS records missing**: No domains are configured to point to the server  
✅ **Application running**: Nginx is serving the application on port 80

## Solution: DNS Configuration

To make the Haroti LPG system accessible via domain names, you need to configure DNS A records.

### Option 1: Use harotilimited.com or harotilimited.mw

If you own or plan to register `harotilimited.com` or `harotilimited.mw`:

#### Step 1: Register the domain
- Register `harotilimited.com` with a registrar (e.g., Namecheap, GoDaddy, Google Domains)
- OR register `harotilimited.mw` with a Malawi domain registrar

#### Step 2: Configure DNS A Records

Add the following DNS records at your domain registrar or DNS provider:

```
Type    Name                    Value               TTL
----    ----                    -----               ---
A       @                       169.58.127.129      300
A       www                     169.58.127.129      300
A       lpg                     169.58.127.129      300
```

This will make the system accessible at:
- `http://harotilimited.com/`
- `http://www.harotilimited.com/`
- `http://lpg.harotilimited.com/`

### Option 2: Use lpg.aircargo.mw

If you have access to the `aircargo.mw` domain:

#### Configure DNS A Record

Add this DNS record in your DNS provider for the `aircargo.mw` domain:

```
Type    Name    Value               TTL
----    ----    -----               ---
A       lpg     169.58.127.129      300
```

This will make the system accessible at: `http://lpg.aircargo.mw/`

### Option 3: Continue using IP address

If DNS setup is not immediately possible, the system is accessible via direct IP:

**Access URL**: `http://169.58.127.129/`

## Post-DNS Configuration Steps

### 1. Update CORS Configuration

Once you have a domain configured, update the CORS settings:

**File**: `/opt/haroti-lpg/.env` on the production server

```bash
# Replace with your actual domain
CORS_ORIGIN=https://lpg.harotilimited.com
```

Or for multiple domains:
```bash
CORS_ORIGIN=https://lpg.harotilimited.com,https://harotilimited.com,https://www.harotilimited.com
```

### 2. Update Nginx Configuration (if needed for specific domain)

If you want nginx to respond to a specific server name instead of the wildcard `_`:

**File**: `frontend/nginx.conf`

```nginx
server {
  listen 80;
  server_name lpg.harotilimited.com harotilimited.com www.harotilimited.com;
  # ... rest of config
}
```

### 3. Restart the Application

After updating configuration:

```bash
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml --env-file .env down
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## SSL/HTTPS Setup (Recommended)

After DNS is configured and propagated, secure the connection with Let's Encrypt SSL:

### 1. Install Certbot

```bash
apt-get update
apt-get install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
# Stop the application temporarily
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml --env-file .env down

# Obtain certificate (replace with your domain)
certbot certonly --standalone -d lpg.harotilimited.com

# Restart the application
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

### 3. Configure Nginx for SSL

Update `frontend/nginx.conf`:

```nginx
server {
  listen 80;
  server_name lpg.harotilimited.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name lpg.harotilimited.com;
  
  ssl_certificate /etc/letsencrypt/live/lpg.harotilimited.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/lpg.harotilimited.com/privkey.pem;
  
  root /usr/share/nginx/html;
  index index.html;

  location /api/ {
    proxy_pass http://api:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### 4. Mount SSL Certificates in Docker

Update `docker-compose.prod.yml` to mount the certificates:

```yaml
  web:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: haroti-web
    restart: unless-stopped
    depends_on:
      - api
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
    networks:
      - haroti_net
```

### 5. Update CORS for HTTPS

Update `/opt/haroti-lpg/.env`:

```bash
CORS_ORIGIN=https://lpg.harotilimited.com
```

### 6. Rebuild and Restart

```bash
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

### 7. Set up Auto-Renewal

```bash
# Test renewal
certbot renew --dry-run

# Add to crontab for auto-renewal
echo "0 3 * * * certbot renew --quiet --post-hook 'cd /opt/haroti-lpg && docker compose -f docker-compose.prod.yml --env-file .env restart web'" | crontab -
```

## DNS Propagation

After configuring DNS:
- **Propagation time**: 5 minutes to 48 hours (typically 1-4 hours)
- **Check propagation**: Use https://dnschecker.org/
- **Test locally**: `nslookup lpg.harotilimited.com`

## Firewall Configuration

Ensure the server firewall allows HTTP and HTTPS traffic:

```bash
# For HTTP
ufw allow 80/tcp

# For HTTPS (after SSL setup)
ufw allow 443/tcp

# Check status
ufw status
```

## Verification

After DNS is configured and propagated:

```bash
# Check DNS resolution
nslookup lpg.harotilimited.com

# Test HTTP access
curl -I http://lpg.harotilimited.com/

# Test HTTPS access (after SSL setup)
curl -I https://lpg.harotilimited.com/
```

## Current Access (Temporary)

Until DNS is configured, access the system directly via IP:

- **Web UI**: http://169.58.127.129/
- **API**: http://169.58.127.129/api/
- **Swagger**: http://169.58.127.129/api/docs
- **Demo Login**: `admin` / `Password123!`

## Troubleshooting

### DNS not resolving
- Wait 1-4 hours for propagation
- Check DNS records at your registrar
- Verify nameservers are set correctly
- Use `dig lpg.harotilimited.com` for detailed DNS info

### Connection refused
- Check if Docker containers are running: `docker ps`
- Check firewall: `ufw status`
- Verify server IP: `curl -I http://169.58.127.129/`

### SSL certificate errors
- Verify domain DNS is propagated before running certbot
- Check certificate paths in nginx.conf
- Ensure certificates are mounted in Docker container
- Check certificate renewal: `certbot certificates`

## Recommended Domain Names

For Haroti Holdings Limited, consider these professional domain options:

1. **Primary domain**: `harotilimited.com` or `harotilimited.mw`
2. **LPG subdomain**: `lpg.harotilimited.com`
3. **Alternative**: `harotigas.com` or `harotigas.mw`

## Next Steps

1. ✅ Verify server is accessible: http://169.58.127.129/ (confirmed working)
2. ⏳ Register or configure domain name
3. ⏳ Add DNS A records pointing to `169.58.127.129`
4. ⏳ Wait for DNS propagation (1-4 hours)
5. ⏳ Test domain access
6. ⏳ Configure SSL certificate with Let's Encrypt
7. ⏳ Update CORS configuration for HTTPS
8. ⏳ Set up automatic SSL renewal

## Support

For DNS configuration assistance, contact your domain registrar or DNS provider.

For application-specific issues, refer to the deployment documentation in `README.DEPLOY.md`.
