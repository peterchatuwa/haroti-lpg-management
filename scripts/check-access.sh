#!/bin/bash
# Haroti LPG System Access Diagnostic Tool
# Checks DNS, server connectivity, and application status

set -e

echo "================================================"
echo "Haroti LPG System - Access Diagnostic"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server IP
SERVER_IP="169.58.127.129"

# Domains to check
DOMAINS=("harotilimited.com" "harotilimited.mw" "lpg.aircargo.mw" "lpg.harotilimited.com" "www.harotilimited.com")

echo "1. Checking DNS Resolution"
echo "----------------------------"
DNS_OK=0
for domain in "${DOMAINS[@]}"; do
    echo -n "Checking $domain... "
    if nslookup "$domain" &>/dev/null; then
        IP=$(nslookup "$domain" | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
        if [ "$IP" == "$SERVER_IP" ]; then
            echo -e "${GREEN}✓ Resolves to $IP${NC}"
            DNS_OK=$((DNS_OK + 1))
        else
            echo -e "${YELLOW}⚠ Resolves to $IP (expected $SERVER_IP)${NC}"
        fi
    else
        echo -e "${RED}✗ No DNS record found${NC}"
    fi
done

echo ""
echo "2. Checking Direct IP Access"
echo "-----------------------------"
echo -n "Checking http://$SERVER_IP/... "
if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "http://$SERVER_IP/" | grep -q "200"; then
    echo -e "${GREEN}✓ Server is accessible (HTTP 200 OK)${NC}"
    SERVER_OK=1
else
    echo -e "${RED}✗ Server is not accessible${NC}"
    SERVER_OK=0
fi

echo ""
echo "3. Checking API Endpoint"
echo "------------------------"
echo -n "Checking http://$SERVER_IP/api/... "
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "http://$SERVER_IP/api/" || echo "000")
if [ "$API_STATUS" == "200" ] || [ "$API_STATUS" == "404" ] || [ "$API_STATUS" == "301" ]; then
    echo -e "${GREEN}✓ API endpoint responding (HTTP $API_STATUS)${NC}"
else
    echo -e "${RED}✗ API endpoint not responding (HTTP $API_STATUS)${NC}"
fi

echo ""
echo "4. Checking Domain Access (if DNS configured)"
echo "----------------------------------------------"
for domain in "${DOMAINS[@]}"; do
    if nslookup "$domain" &>/dev/null; then
        echo -n "Checking http://$domain/... "
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "http://$domain/" || echo "000")
        if [ "$HTTP_STATUS" == "200" ]; then
            echo -e "${GREEN}✓ Accessible (HTTP $HTTP_STATUS)${NC}"
        else
            echo -e "${YELLOW}⚠ HTTP $HTTP_STATUS${NC}"
        fi
    fi
done

echo ""
echo "================================================"
echo "Summary"
echo "================================================"
echo ""

if [ $DNS_OK -gt 0 ]; then
    echo -e "${GREEN}✓${NC} DNS: $DNS_OK domain(s) configured correctly"
else
    echo -e "${YELLOW}⚠${NC} DNS: No domains configured - using IP address access"
    echo "   Action required: Configure DNS A records"
    echo "   See docs/DOMAIN_DNS_SETUP.md for instructions"
fi

if [ $SERVER_OK -eq 1 ]; then
    echo -e "${GREEN}✓${NC} Server: Application is running and accessible"
else
    echo -e "${RED}✗${NC} Server: Application is not accessible"
    echo "   Action required: Check Docker containers and firewall"
fi

echo ""
echo "Current Access Methods:"
echo "-----------------------"
echo "Web UI:  http://$SERVER_IP/"
echo "API:     http://$SERVER_IP/api/"
echo "Swagger: http://$SERVER_IP/api/docs"
echo "Login:   admin / Password123!"

if [ $DNS_OK -gt 0 ]; then
    echo ""
    echo "Domain Access:"
    echo "--------------"
    for domain in "${DOMAINS[@]}"; do
        if nslookup "$domain" &>/dev/null; then
            echo "http://$domain/"
        fi
    done
fi

echo ""
echo "================================================"
echo "For DNS setup instructions:"
echo "  cat docs/DOMAIN_DNS_SETUP.md"
echo "================================================"
