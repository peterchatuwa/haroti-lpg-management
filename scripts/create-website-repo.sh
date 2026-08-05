#!/bin/bash
set -euo pipefail

# Script to create separate GitHub repository for Haroti Gas Website
# Run this on your VPS or local machine with GitHub access

echo "=========================================="
echo "Haroti Gas Website - GitHub Repo Setup"
echo "=========================================="
echo ""

# Configuration
WEBSITE_REPO_NAME="haroti-gas-website"
GITHUB_USERNAME="peterchatuwa"  # Change if different
TEMP_DIR="/tmp/haroti-website-setup"
TARGET_DIR="/opt/haroti-gas-website"

echo "Step 1: Extract website from main repository..."
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

# Clone the main repo
git clone https://github.com/$GITHUB_USERNAME/haroti-lpg-management.git
cd haroti-lpg-management
git checkout cursor/domain-vps-setup-376b

# Copy website folder
cp -r website "$TEMP_DIR/website-extracted"

echo "✓ Website extracted"
echo ""

echo "Step 2: Initialize new Git repository..."
cd "$TEMP_DIR/website-extracted"
rm -rf .git

git init
git add .
git commit -m "Initial commit: Haroti Gas Corporate Website

Complete website implementation per HG-TOR-WEB-001:
- All 11 pages fully implemented
- Mobile-first responsive design
- React + TypeScript + Tailwind CSS
- Haroti Gas branding and logo
- Forms with validation
- SEO optimized
- Production ready

Features:
- Home, About, Products & PAYC, Find a Station
- Franchise Opportunities with application form
- Impact & ESG with KPI dashboard
- Investors & Partners page
- News & Updates blog
- Careers with job application
- Contact Us with contact form
- Privacy Policy and Terms of Use

Ready for deployment to harotiholdingslimited.com"

echo "✓ Git repository initialized"
echo ""

echo "Step 3: Instructions to create GitHub repository..."
echo ""
echo "──────────────────────────────────────────────────────"
echo "MANUAL STEP REQUIRED:"
echo "──────────────────────────────────────────────────────"
echo ""
echo "1. Go to: https://github.com/new"
echo "2. Repository name: $WEBSITE_REPO_NAME"
echo "3. Description: Haroti Gas Corporate Website - Clean LPG energy solutions for Malawi"
echo "4. Make it: Public (or Private if preferred)"
echo "5. Do NOT initialize with README, .gitignore, or license"
echo "6. Click 'Create repository'"
echo ""
echo "After creating the repository, press ENTER to continue..."
read -p ""

echo ""
echo "Step 4: Connect to GitHub and push..."
cd "$TEMP_DIR/website-extracted"

# Add remote
git remote add origin https://github.com/$GITHUB_USERNAME/$WEBSITE_REPO_NAME.git
git branch -M main

echo ""
echo "Pushing to GitHub (you may need to enter credentials)..."
git push -u origin main

echo "✓ Code pushed to GitHub"
echo ""

echo "Step 5: Move to production location..."
sudo mkdir -p "$TARGET_DIR"
sudo cp -r "$TEMP_DIR/website-extracted/"* "$TARGET_DIR/"
sudo chown -R $(whoami):$(whoami) "$TARGET_DIR"

cd "$TARGET_DIR"
git remote set-url origin https://github.com/$GITHUB_USERNAME/$WEBSITE_REPO_NAME.git

echo "✓ Website moved to $TARGET_DIR"
echo ""

echo "Step 6: Clean up temporary files..."
rm -rf "$TEMP_DIR"
echo "✓ Cleanup complete"
echo ""

echo "=========================================="
echo "✓ SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "Repository URL:"
echo "https://github.com/$GITHUB_USERNAME/$WEBSITE_REPO_NAME"
echo ""
echo "Local directory:"
echo "$TARGET_DIR"
echo ""
echo "Next steps:"
echo "1. Replace logo placeholder: cp your-logo.png $TARGET_DIR/public/haroti-logo.png"
echo "2. Build website: cd $TARGET_DIR && npm install && npm run build"
echo "3. Deploy to server: Follow DEPLOYMENT_GUIDE.md"
echo ""
echo "See DEPLOYMENT_GUIDE.md for full deployment instructions."
echo "=========================================="
