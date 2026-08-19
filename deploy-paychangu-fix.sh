#!/bin/bash

# Deployment Script for PayChangu Payment Reflection Fix
# This script deploys the PayChangu fix to production
#
# Prerequisites:
# - SSH access to production server
# - Docker and Docker Compose installed on production server
# - .env file configured with all required environment variables
#
# Usage: ./deploy-paychangu-fix.sh

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   PayChangu Payment Fix Deployment                             ║"
echo "║   Haroti Holdings LPG Management System                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BRANCH="${1:-master}"
COMPOSE_FILE="docker-compose.prod.yml"

echo -e "${BLUE}[INFO]${NC} Deployment branch: ${BRANCH}"
echo ""

# Confirmation prompt
echo -e "${YELLOW}⚠️  WARNING: This will deploy to production!${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}[ABORTED]${NC} Deployment cancelled."
    exit 1
fi

echo -e "${GREEN}[STEP 1/8]${NC} Pulling latest code from GitHub..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH
echo -e "${GREEN}✓${NC} Code updated to latest ${BRANCH}"
echo ""

echo -e "${GREEN}[STEP 2/8]${NC} Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo -e "${RED}[ERROR]${NC} .env file not found!"
    echo "Please create .env file with all required variables."
    echo "See backend/.env.example for reference."
    exit 1
fi
echo -e "${GREEN}✓${NC} Environment file found"
echo ""

echo -e "${GREEN}[STEP 3/8]${NC} Verifying PayChangu configuration..."
if ! grep -q "PAYCHANGU_SECRET_KEY=" .env || ! grep -q "PAYCHANGU_WEBHOOK_SECRET=" .env; then
    echo -e "${YELLOW}[WARNING]${NC} PayChangu credentials not found in .env"
    echo "Make sure to configure:"
    echo "  - PAYCHANGU_CLIENT_ID"
    echo "  - PAYCHANGU_API_KEY or PAYCHANGU_SECRET_KEY"
    echo "  - PAYCHANGU_WEBHOOK_SECRET"
    echo "  - PAYCHANGU_CALLBACK_URL"
    read -p "Continue anyway? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        exit 1
    fi
fi
echo -e "${GREEN}✓${NC} PayChangu configuration verified"
echo ""

echo -e "${GREEN}[STEP 4/8]${NC} Creating backup of current database..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
docker exec haroti-postgres pg_dump -U haroti haroti_lpg > "$BACKUP_FILE" 2>/dev/null || {
    echo -e "${YELLOW}[WARNING]${NC} Could not create database backup"
    echo "Database may not be running or docker exec failed"
    read -p "Continue without backup? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        exit 1
    fi
}
if [ -f "$BACKUP_FILE" ]; then
    echo -e "${GREEN}✓${NC} Backup created: ${BACKUP_FILE}"
else
    echo -e "${YELLOW}⚠${NC}  No backup created"
fi
echo ""

echo -e "${GREEN}[STEP 5/8]${NC} Building new Docker images..."
docker compose -f $COMPOSE_FILE build api
echo -e "${GREEN}✓${NC} API image built"
echo ""

echo -e "${GREEN}[STEP 6/8]${NC} Stopping current API container..."
docker compose -f $COMPOSE_FILE stop api
echo -e "${GREEN}✓${NC} API container stopped"
echo ""

echo -e "${GREEN}[STEP 7/8]${NC} Starting updated API container..."
docker compose -f $COMPOSE_FILE up -d api
echo -e "${GREEN}✓${NC} API container started"
echo ""

echo -e "${GREEN}[STEP 8/8]${NC} Verifying deployment..."
sleep 5  # Give the API a moment to start

# Check if container is running
if docker ps | grep -q "haroti-api"; then
    echo -e "${GREEN}✓${NC} API container is running"
else
    echo -e "${RED}[ERROR]${NC} API container failed to start!"
    echo "Check logs with: docker logs haroti-api"
    exit 1
fi

# Check API health
API_HEALTH=$(docker exec haroti-api wget -qO- http://localhost:3000/api/health 2>/dev/null || echo "failed")
if [[ $API_HEALTH == *"ok"* ]]; then
    echo -e "${GREEN}✓${NC} API health check passed"
else
    echo -e "${YELLOW}[WARNING]${NC} API health check did not return 'ok'"
    echo "Response: $API_HEALTH"
    echo "The API may still be starting up..."
fi
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  Deployment Complete! ✓                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Monitor the logs for PayChangu payment processing:"
echo "   ${GREEN}docker logs -f haroti-api | grep PaychanguService${NC}"
echo ""
echo "2. Test a PayChangu payment to verify the fix works"
echo ""
echo "3. Review the verification guide:"
echo "   ${GREEN}cat PAYCHANGU_FIX_VERIFICATION.md${NC}"
echo ""
echo "4. Check for any errors in the logs:"
echo "   ${GREEN}docker logs haroti-api --tail 100${NC}"
echo ""
echo -e "${YELLOW}Rollback Instructions (if needed):${NC}"
echo "If issues occur, rollback to the previous commit:"
echo "   git checkout <previous-commit-hash>"
echo "   docker compose -f $COMPOSE_FILE up -d --build api"
echo ""
echo "Database backup location: ${BACKUP_FILE}"
echo ""
echo -e "${GREEN}Deployment completed successfully at $(date)${NC}"
