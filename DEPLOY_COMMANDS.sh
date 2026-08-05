#!/bin/bash
# Copy and paste these commands into your VPS terminal

echo "=============================================="
echo "  Haroti Gas - VPS Deployment"
echo "  Run these commands on: root@169.58.127.129"
echo "=============================================="
echo ""

# First, SSH into your VPS:
# ssh root@169.58.127.129

# Then run these commands:

# 1. Update system
echo "Updating system packages..."
apt-get update

# 2. Install prerequisites
echo "Installing prerequisites..."
apt-get install -y git curl wget

# 3. Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo "Docker already installed"
fi

# 4. Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js already installed"
fi

# 5. Clone or update repository
if [ -d "/opt/haroti-lpg" ]; then
    echo "Updating existing repository..."
    cd /opt/haroti-lpg
    git fetch origin
    git checkout cursor/domain-vps-setup-376b
    git pull origin cursor/domain-vps-setup-376b
else
    echo "Cloning repository..."
    cd /opt
    git clone https://github.com/peterchatuwa/haroti-lpg-management.git haroti-lpg
    cd haroti-lpg
    git checkout cursor/domain-vps-setup-376b
fi

# 6. Run the automated deployment script
echo "Running deployment script..."
cd /opt/haroti-lpg
bash scripts/deploy-to-vps.sh

echo ""
echo "=============================================="
echo "Deployment complete!"
echo "=============================================="
echo ""
echo "Test your site at:"
echo "  https://harotiholdingslimited.com"
echo "  https://harotiholdingslimited.com/app"
echo ""
