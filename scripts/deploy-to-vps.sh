#!/bin/bash
set -euo pipefail

# Complete deployment script for Haroti Gas to VPS
# Run this script on your VPS (169.58.127.129)

echo "=============================================="
echo "  Haroti Gas - Complete VPS Deployment"
echo "  Domain: harotiholdingslimited.com"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="harotiholdingslimited.com"
EMAIL="admin@harotiholdingslimited.com"  # Change this to your email
VPS_IP="169.58.127.129"
INSTALL_DIR="/opt/haroti-lpg"
WEBSITE_DIR="/opt/haroti-gas-website"

echo -e "${BLUE}Step 1: System Prerequisites${NC}"
echo "Checking system requirements..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}Please run as root (use sudo)${NC}"
   exit 1
fi

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js installed${NC}"
else
    echo -e "${GREEN}✓ Node.js already installed${NC}"
fi

echo ""
echo -e "${BLUE}Step 2: Clone Repository${NC}"

# Clone main repository
if [ -d "$INSTALL_DIR" ]; then
    echo "Directory exists. Updating..."
    cd "$INSTALL_DIR"
    git pull origin cursor/domain-vps-setup-376b
else
    echo "Cloning repository..."
    mkdir -p /opt
    cd /opt
    git clone https://github.com/peterchatuwa/haroti-lpg-management.git haroti-lpg
    cd haroti-lpg
    git checkout cursor/domain-vps-setup-376b
fi

echo -e "${GREEN}✓ Repository ready at $INSTALL_DIR${NC}"

echo ""
echo -e "${BLUE}Step 3: Configure Environment${NC}"

cd "$INSTALL_DIR"

if [ ! -f .env ]; then
    cp .env.production.example .env
    
    # Generate secure passwords
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    
    # Update .env file
    sed -i "s|DATABASE_PASSWORD=CHANGE_ME|DATABASE_PASSWORD=$DB_PASSWORD|g" .env
    sed -i "s|JWT_SECRET=CHANGE_ME|JWT_SECRET=$JWT_SECRET|g" .env
    sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://$DOMAIN|g" .env
    
    echo -e "${GREEN}✓ Environment configured with secure passwords${NC}"
    echo -e "${YELLOW}Passwords saved in $INSTALL_DIR/.env${NC}"
else
    echo -e "${GREEN}✓ Environment file exists${NC}"
fi

echo ""
echo -e "${BLUE}Step 4: Setup SSL Certificates${NC}"

# Run SSL setup
if [ ! -d "$INSTALL_DIR/ssl" ] || [ ! -f "$INSTALL_DIR/ssl/fullchain.pem" ]; then
    echo "Setting up SSL certificates with Let's Encrypt..."
    bash "$INSTALL_DIR/scripts/setup-ssl.sh" "$DOMAIN" "$EMAIL"
    echo -e "${GREEN}✓ SSL certificates obtained${NC}"
else
    echo -e "${GREEN}✓ SSL certificates already exist${NC}"
fi

echo ""
echo -e "${BLUE}Step 5: Configure Firewall${NC}"

# Setup UFW firewall
if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 22/tcp
    ufw allow OpenSSH
    echo -e "${GREEN}✓ Firewall configured${NC}"
else
    echo -e "${YELLOW}⚠ UFW not found, skipping firewall setup${NC}"
fi

echo ""
echo -e "${BLUE}Step 6: Extract and Setup Website${NC}"

# Create website directory
if [ ! -d "$WEBSITE_DIR" ]; then
    echo "Extracting website to separate directory..."
    cp -r "$INSTALL_DIR/website" "$WEBSITE_DIR"
    echo -e "${GREEN}✓ Website extracted to $WEBSITE_DIR${NC}"
else
    echo -e "${GREEN}✓ Website directory exists${NC}"
fi

# Build website
cd "$WEBSITE_DIR"
if [ ! -d "node_modules" ]; then
    echo "Installing website dependencies..."
    npm install
fi

echo "Building website..."
npm run build

# Copy built website to main app
echo "Deploying website to main application..."
mkdir -p "$INSTALL_DIR/website-dist"
cp -r dist/* "$INSTALL_DIR/website-dist/"

echo -e "${GREEN}✓ Website built and deployed${NC}"

echo ""
echo -e "${BLUE}Step 7: Update Nginx Configuration${NC}"

# Create updated nginx config with both website and app
cat > "$INSTALL_DIR/frontend/nginx.conf" << 'NGINX_EOF'
# HTTP server - redirect to HTTPS
server {
  listen 80;
  server_name harotiholdingslimited.com www.harotiholdingslimited.com;

  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  location / {
    return 301 https://$server_name$request_uri;
  }
}

# HTTPS server
server {
  listen 443 ssl http2;
  server_name harotiholdingslimited.com www.harotiholdingslimited.com;
  
  ssl_certificate /etc/nginx/ssl/fullchain.pem;
  ssl_certificate_key /etc/nginx/ssl/privkey.pem;

  # SSL configuration
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
  ssl_prefer_server_ciphers off;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;

  # Corporate Website (root)
  location / {
    root /usr/share/nginx/html/website;
    try_files $uri $uri/ /index.html;
  }

  # Management Application
  location /app {
    alias /usr/share/nginx/html/admin;
    try_files $uri $uri/ /app/index.html;
  }

  # API Backend
  location /api/ {
    proxy_pass http://api:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_cache_bypass $http_upgrade;
  }

  # Gzip compression
  gzip on;
  gzip_vary on;
  gzip_proxied any;
  gzip_comp_level 6;
  gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
}
NGINX_EOF

echo -e "${GREEN}✓ Nginx configuration updated${NC}"

echo ""
echo -e "${BLUE}Step 8: Update Docker Compose${NC}"

# Update docker-compose to mount website
cat > "$INSTALL_DIR/docker-compose.prod.yml" << 'DOCKER_EOF'
name: haroti

services:
  postgres:
    image: postgres:16-alpine
    container_name: haroti-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DATABASE_USER:-haroti}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: ${DATABASE_NAME:-haroti_lpg}
    volumes:
      - haroti_pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - haroti_net

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: haroti-api
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USER: ${DATABASE_USER:-haroti}
      DATABASE_PASSWORD: ${DATABASE_PASSWORD}
      DATABASE_NAME: ${DATABASE_NAME:-haroti_lpg}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-12h}
      CORS_ORIGIN: ${CORS_ORIGIN:-https://harotiholdingslimited.com}
    networks:
      - haroti_net

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
      - ./ssl:/etc/nginx/ssl:ro
      - ./certbot/www:/var/www/certbot:ro
      - ./website-dist:/usr/share/nginx/html/website:ro
      - ./frontend/dist:/usr/share/nginx/html/admin:ro
    networks:
      - haroti_net

volumes:
  haroti_pg_data:

networks:
  haroti_net:
    name: haroti_net
    driver: bridge
DOCKER_EOF

echo -e "${GREEN}✓ Docker Compose updated${NC}"

echo ""
echo -e "${BLUE}Step 9: Deploy Application${NC}"

cd "$INSTALL_DIR"
echo "Building and starting containers..."
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

echo "Waiting for services to start..."
sleep 10

# Check container status
docker compose -f docker-compose.prod.yml ps

echo -e "${GREEN}✓ Application deployed${NC}"

echo ""
echo "=============================================="
echo -e "${GREEN}✓ DEPLOYMENT COMPLETE!${NC}"
echo "=============================================="
echo ""
echo -e "${YELLOW}Important Information:${NC}"
echo ""
echo "VPS IP Address: $VPS_IP"
echo "Domain: $DOMAIN"
echo ""
echo -e "${BLUE}URLs (after DNS is configured):${NC}"
echo "  • Corporate Website: https://$DOMAIN"
echo "  • Management System: https://$DOMAIN/app"
echo "  • API Documentation: https://$DOMAIN/api/docs"
echo ""
echo -e "${YELLOW}Demo Login Credentials:${NC}"
echo "  Username: admin"
echo "  Password: Password123!"
echo "  ${RED}⚠ CHANGE THIS PASSWORD IMMEDIATELY!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Configure DNS records (see DNS_RECORDS.txt)"
echo "2. Wait for DNS propagation (5-60 minutes)"
echo "3. Test all URLs"
echo "4. Change default admin password"
echo "5. Upload your logo to $WEBSITE_DIR/public/haroti-logo.png"
echo ""
echo "View logs:"
echo "  docker logs haroti-web -f"
echo "  docker logs haroti-api -f"
echo ""
echo "=============================================="
