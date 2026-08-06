#!/bin/bash
# Quick Website Update Script for Haroti Gas
# Run this on your VPS to update the website

set -euo pipefail

echo "=============================================="
echo "  Haroti Gas - Website Update Script"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Change to project directory
cd /opt/haroti-lpg

echo -e "${BLUE}Step 1: Pulling latest changes from GitHub...${NC}"
git pull origin cursor/domain-vps-setup-376b

echo ""
echo -e "${BLUE}Step 2: Building website...${NC}"
cd website
npm install --silent
npm run build

echo ""
echo -e "${BLUE}Step 3: Deploying to web server...${NC}"
cd /opt/haroti-lpg
rm -rf website-dist
cp -r website/dist website-dist

echo ""
echo -e "${BLUE}Step 4: Restarting web container...${NC}"
docker restart haroti-web

echo ""
echo -e "${BLUE}Step 5: Waiting for server to restart...${NC}"
sleep 3

echo ""
echo "=============================================="
echo -e "${GREEN}✅ Website Updated Successfully!${NC}"
echo "=============================================="
echo ""
echo "Your website is now live with the latest changes"
echo "Visit: https://harotiholdingslimited.com"
echo ""
echo "Clear your browser cache (Ctrl+Shift+Delete) to see changes"
echo ""
