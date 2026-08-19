# Production Deployment Guide - PayChangu Payment Fix

## Overview

This guide provides step-by-step instructions for deploying the PayChangu payment reflection fix to your production environment.

**What this deployment fixes:**
- PayChangu payments not reflecting in the system
- Sales stuck in PENDING_PAYMENT status
- PAYC meter credits not being updated after payment

**Changes included:**
- Synchronous webhook processing with proper error handling
- Comprehensive logging throughout payment flow
- Improved error handling in sale completion and PAYC top-up operations

## Deployment Methods

### Method 1: Automated Deployment Script (Recommended)

#### Prerequisites
- SSH access to production server
- Docker and Docker Compose installed
- `.env` file configured with PayChangu credentials

#### Steps

1. **SSH into your production server:**
```bash
ssh user@your-production-server.com
```

2. **Navigate to the application directory:**
```bash
cd /path/to/haroti-lpg-management
```

3. **Run the deployment script:**
```bash
./deploy-paychangu-fix.sh
```

The script will:
- ✅ Pull latest code from GitHub (master branch)
- ✅ Verify environment configuration
- ✅ Create database backup
- ✅ Build new Docker images
- ✅ Restart API container with zero downtime
- ✅ Verify deployment health

4. **Monitor the deployment:**
```bash
# Follow API logs
docker logs -f haroti-api

# Filter for PayChangu logs specifically
docker logs -f haroti-api | grep PaychanguService
```

### Method 2: Manual Deployment

If you prefer manual control or the script doesn't work in your environment:

#### Step 1: Backup Database
```bash
# Create backup
docker exec haroti-postgres pg_dump -U haroti haroti_lpg > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh backup_*.sql
```

#### Step 2: Update Code
```bash
cd /path/to/haroti-lpg-management

# Fetch latest changes
git fetch origin

# Checkout master branch
git checkout master

# Pull latest code
git pull origin master

# Verify you have the latest commit
git log --oneline -5
# Should show: "Merge PayChangu payment reflection fix to master"
```

#### Step 3: Verify Environment Variables

Ensure your `.env` file has PayChangu credentials:
```bash
# Check if PayChangu variables are set
grep PAYCHANGU .env

# Should show:
# PAYCHANGU_CLIENT_ID=...
# PAYCHANGU_SECRET_KEY=...
# PAYCHANGU_WEBHOOK_SECRET=...
# PAYCHANGU_CALLBACK_URL=...
```

If not configured, add them:
```bash
nano .env
```

Add/update these variables:
```env
PAYCHANGU_CLIENT_ID=your-client-id
PAYCHANGU_SECRET_KEY=sec-live-xxxxxxxxxx
PAYCHANGU_WEBHOOK_SECRET=whsec-xxxxxxxxxx
PAYCHANGU_CALLBACK_URL=https://yourdomain.com/api/paychangu/webhook
PAYCHANGU_BASE_URL=https://api.paychangu.com
```

#### Step 4: Rebuild and Restart API Container
```bash
# Build new API image
docker compose -f docker-compose.prod.yml build api

# Stop current API container
docker compose -f docker-compose.prod.yml stop api

# Start updated API container
docker compose -f docker-compose.prod.yml up -d api

# Or rebuild and restart in one command:
# docker compose -f docker-compose.prod.yml up -d --build api
```

#### Step 5: Verify Deployment
```bash
# Check container status
docker ps | grep haroti-api

# Check API health
docker exec haroti-api wget -qO- http://localhost:3000/api/health

# View recent logs
docker logs haroti-api --tail 100

# Follow logs in real-time
docker logs -f haroti-api
```

## Post-Deployment Verification

### 1. Check Container Status
```bash
docker ps -a | grep haroti
```

All containers should show status "Up". If API is "Restarting" or "Exited", check logs.

### 2. View Deployment Logs
```bash
# View last 50 lines
docker logs haroti-api --tail 50

# Follow logs in real-time
docker logs -f haroti-api

# Filter for errors
docker logs haroti-api 2>&1 | grep -i error
```

### 3. Test PayChangu Payment Flow

**Option A: Check existing payments**
```bash
# Connect to database
docker exec -it haroti-postgres psql -U haroti -d haroti_lpg

# Check recent PayChangu transactions
SELECT 
    transaction_ref,
    status,
    amount,
    sale_id,
    payc_meter_id,
    completed_at,
    created_at
FROM paychangu_transactions
ORDER BY created_at DESC
LIMIT 10;

# Check unprocessed webhooks
SELECT 
    event_type,
    transaction_ref,
    processed,
    error_message,
    created_at
FROM paychangu_webhooks
WHERE processed = false
ORDER BY created_at DESC;
```

**Option B: Test a new payment**
1. Initiate a small test payment via PayChangu
2. Monitor logs for payment processing:
```bash
docker logs -f haroti-api | grep PaychanguService
```
3. Verify the payment completes successfully
4. Check that the sale status updates to COMPLETED

### 4. Monitor for Expected Log Messages

After deployment, successful payments should show:

```
[PaychanguService] Initiating PayChangu payment: amount=X, method=Y, saleId=Z
[PaychanguService] Created PayChangu transaction ABC with status PENDING
[PaychanguService] Received webhook for charge ABC, event: payment.completed
[PaychanguService] Processing successful payment for ABC
[PaychanguService] Completing sale Z for payment ABC
[PaychanguService] Sale Z completed successfully
[PaychanguService] Payment completed successfully: ABC
```

### 5. Full Verification Checklist

Follow the comprehensive guide: [PAYCHANGU_FIX_VERIFICATION.md](./PAYCHANGU_FIX_VERIFICATION.md)

## Monitoring After Deployment

### Watch for Issues
```bash
# Monitor errors in real-time
docker logs -f haroti-api 2>&1 | grep -i "error\|failed\|exception"

# Check PayChangu-specific logs
docker logs -f haroti-api | grep PaychanguService

# Monitor webhook processing
docker logs -f haroti-api | grep "webhook"
```

### Key Metrics to Monitor

1. **Payment Success Rate**
   - Check how many payments complete successfully vs fail
   
2. **Webhook Processing**
   - Ensure webhooks are being processed (not stuck as unprocessed)
   
3. **Sale Completion**
   - Verify sales are moving from PENDING_PAYMENT to COMPLETED
   
4. **Error Logs**
   - Watch for repeated errors that might indicate a problem

## Troubleshooting

### Issue: API Container Won't Start

```bash
# Check detailed logs
docker logs haroti-api

# Common issues:
# - Database connection failed: Check DATABASE_* env vars
# - Port already in use: Check if old container is still running
# - Build errors: Review build logs
```

### Issue: Payments Still Not Reflecting

1. **Check logs for errors:**
```bash
docker logs haroti-api | grep -A 10 "PaychanguService.*error"
```

2. **Verify webhook endpoint is reachable:**
```bash
# From external server
curl -X POST https://yourdomain.com/api/paychangu/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
  
# Should return: {"success": true} (even with invalid signature)
```

3. **Check PayChangu webhook configuration:**
   - Login to PayChangu dashboard
   - Verify webhook URL is correct
   - Verify webhook secret matches your .env

### Issue: Database Migration Needed

If the deployment requires database migrations:

```bash
# Run migrations
docker exec haroti-api npm run migration:run

# Verify migration status
docker exec haroti-api npm run migration:show
```

## Rollback Procedure

If critical issues occur after deployment:

### Quick Rollback
```bash
# 1. Identify previous commit
git log --oneline -10

# 2. Checkout previous commit
git checkout <previous-commit-hash>

# 3. Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build api

# 4. Verify rollback
docker logs haroti-api --tail 50
```

### Full Rollback with Database Restore (if needed)
```bash
# 1. Stop API container
docker compose -f docker-compose.prod.yml stop api

# 2. Restore database from backup
docker exec -i haroti-postgres psql -U haroti -d haroti_lpg < backup_YYYYMMDD_HHMMSS.sql

# 3. Checkout previous code version
git checkout <previous-commit-hash>

# 4. Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build api
```

## Environment-Specific Notes

### Production Environment Variables

Ensure these are set correctly in `.env`:

```env
# Node Environment
NODE_ENV=production

# PayChangu (Production)
PAYCHANGU_CLIENT_ID=pub-live-xxxxxxxxxx
PAYCHANGU_SECRET_KEY=sec-live-xxxxxxxxxx
PAYCHANGU_WEBHOOK_SECRET=whsec-xxxxxxxxxx
PAYCHANGU_BASE_URL=https://api.paychangu.com
PAYCHANGU_CALLBACK_URL=https://harotiholdingslimited.com/api/paychangu/webhook
PAYCHANGU_CARD_REDIRECT_URL=https://harotiholdingslimited.com/erp/pos

# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=haroti
DATABASE_PASSWORD=<secure-password>
DATABASE_NAME=haroti_lpg

# JWT
JWT_SECRET=<secure-random-string>
JWT_EXPIRES_IN=12h

# CORS
CORS_ORIGIN=https://harotiholdingslimited.com,http://harotiholdingslimited.com
```

### Security Checklist

- [ ] All PayChangu credentials are production keys (not test/sandbox)
- [ ] PAYCHANGU_WEBHOOK_SECRET is set and matches PayChangu dashboard
- [ ] JWT_SECRET is a strong random string
- [ ] DATABASE_PASSWORD is secure
- [ ] CORS_ORIGIN only includes your production domain
- [ ] SSL/TLS is enabled for the webhook endpoint

## Success Criteria

✅ Deployment is successful when:

1. API container is running without errors
2. Health endpoint returns "ok"
3. New PayChangu payments complete successfully
4. Sales status updates from PENDING_PAYMENT to COMPLETED
5. Comprehensive logs are visible for all payment operations
6. No errors in the logs related to PayChangu processing

## Support

### Logs and Diagnostics

If you need support, collect these logs:

```bash
# API logs (last 500 lines)
docker logs haroti-api --tail 500 > api-logs.txt

# PayChangu-specific logs
docker logs haroti-api 2>&1 | grep PaychanguService > paychangu-logs.txt

# Container status
docker ps -a > container-status.txt

# Recent PayChangu transactions from database
docker exec haroti-postgres psql -U haroti -d haroti_lpg -c \
  "SELECT * FROM paychangu_transactions ORDER BY created_at DESC LIMIT 20;" \
  > recent-transactions.txt
```

### References

- **Verification Guide:** [PAYCHANGU_FIX_VERIFICATION.md](./PAYCHANGU_FIX_VERIFICATION.md)
- **Pull Request:** https://github.com/peterchatuwa/haroti-lpg-management/pull/5
- **Commit Hash:** d3432a4 (merge commit on master)
- **Feature Branch:** cursor/fix-paychangu-payment-reflection-5c24

## Timeline

- **Fix Developed:** August 19, 2026, 9:24 AM UTC
- **Merged to Master:** August 19, 2026, 9:31 AM UTC
- **Ready for Deployment:** August 19, 2026, 9:32 AM UTC

---

**Document Version:** 1.0  
**Last Updated:** August 19, 2026  
**Contact:** See repository maintainers
