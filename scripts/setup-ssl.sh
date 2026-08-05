#!/bin/bash
set -euo pipefail

# Setup SSL certificates using Certbot for Haroti LPG Management
# This script should be run on the VPS after the application is deployed

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: $0 <domain> <email>"
  echo "Example: $0 lpg.example.com admin@example.com"
  exit 1
fi

echo "Setting up SSL for domain: $DOMAIN"
echo "Email for Let's Encrypt notifications: $EMAIL"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit 1
fi

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
  echo "Installing certbot..."
  apt-get update
  apt-get install -y certbot
fi

# Stop nginx temporarily to obtain certificate
echo "Stopping nginx container to obtain certificate..."
cd /opt/haroti-lpg
docker compose -f docker-compose.prod.yml stop web || true

# Obtain certificate using standalone mode
echo "Obtaining SSL certificate from Let's Encrypt..."
certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN" \
  --preferred-challenges http

# Create SSL directory in the project
mkdir -p /opt/haroti-lpg/ssl

# Copy certificates to project directory
echo "Copying certificates..."
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/haroti-lpg/ssl/
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/haroti-lpg/ssl/
chmod 644 /opt/haroti-lpg/ssl/fullchain.pem
chmod 600 /opt/haroti-lpg/ssl/privkey.pem

# Update nginx configuration with domain
echo "Updating nginx configuration..."
cd /opt/haroti-lpg
sed "s/\${DOMAIN_NAME}/$DOMAIN/g" frontend/nginx.conf.template > frontend/nginx.conf

# Update .env file with correct CORS origin
echo "Updating CORS origin in .env..."
sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://$DOMAIN|g" .env

# Set up auto-renewal cron job
echo "Setting up automatic certificate renewal..."
CRON_CMD="0 3 * * * certbot renew --quiet --deploy-hook 'cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/haroti-lpg/ssl/ && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/haroti-lpg/ssl/ && cd /opt/haroti-lpg && docker compose -f docker-compose.prod.yml restart web'"

# Add cron job if it doesn't exist
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_CMD") | crontab -

# Restart the application with new configuration
echo "Restarting application with SSL..."
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

echo ""
echo "✅ SSL setup complete!"
echo ""
echo "Your application is now available at:"
echo "  https://$DOMAIN"
echo ""
echo "Certificate renewal is automatic (daily check at 3 AM)."
echo ""
echo "Next steps:"
echo "1. Ensure your domain DNS A record points to this server's IP"
echo "2. Test your site at https://$DOMAIN"
echo "3. Verify SSL: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
