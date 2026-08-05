#!/bin/bash
set -euo pipefail

# Setup self-signed SSL certificates for development/testing
# Use this ONLY for testing. For production, use setup-ssl.sh with Let's Encrypt

DOMAIN="${1:-localhost}"

echo "Setting up self-signed SSL certificate for: $DOMAIN"
echo "⚠️  WARNING: Self-signed certificates will show security warnings in browsers"
echo "⚠️  For production use, run setup-ssl.sh instead"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit 1
fi

# Create SSL directory
mkdir -p /opt/haroti-lpg/ssl

# Generate self-signed certificate
echo "Generating self-signed certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /opt/haroti-lpg/ssl/privkey.pem \
  -out /opt/haroti-lpg/ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"

chmod 644 /opt/haroti-lpg/ssl/fullchain.pem
chmod 600 /opt/haroti-lpg/ssl/privkey.pem

# Update nginx configuration
echo "Updating nginx configuration..."
cd /opt/haroti-lpg
sed "s/\${DOMAIN_NAME}/$DOMAIN/g" frontend/nginx.conf.template > frontend/nginx.conf

# Update .env file
if [ "$DOMAIN" != "localhost" ]; then
  echo "Updating CORS origin in .env..."
  sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://$DOMAIN|g" .env
else
  echo "Updating CORS origin in .env for localhost..."
  sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=http://localhost|g" .env
fi

# Restart application
echo "Restarting application with SSL..."
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

echo ""
echo "✅ Self-signed SSL setup complete!"
echo ""
echo "⚠️  Your browser will show a security warning because this is a self-signed certificate."
echo "⚠️  You'll need to manually accept the certificate in your browser."
echo ""
echo "Your application is now available at:"
echo "  https://$DOMAIN"
echo ""
echo "For production use with a valid SSL certificate, use:"
echo "  sudo bash scripts/setup-ssl.sh your-domain.com your-email@example.com"
