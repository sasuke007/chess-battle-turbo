#!/bin/bash
# =============================================================================
# Chess WebSocket Server - EC2 Setup Script
# Run this script on a fresh Ubuntu 22.04 EC2 instance
# Usage: bash setup-server.sh
# =============================================================================

set -e  # Exit on error

echo "=========================================="
echo "Chess WebSocket Server Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Some commands will be adjusted."
    SUDO=""
else
    SUDO="sudo"
fi

# =============================================================================
# STEP 1: Update System
# =============================================================================
echo ""
echo "Step 1: Updating system packages..."
$SUDO apt update && $SUDO apt upgrade -y
print_status "System updated"

# =============================================================================
# STEP 2: Install Node.js 22
# =============================================================================
echo ""
echo "Step 2: Installing Node.js 22..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_warning "Node.js already installed: $NODE_VERSION"
else
    curl -fsSL https://deb.nodesource.com/setup_22.x | $SUDO -E bash -
    $SUDO apt install -y nodejs
    print_status "Node.js $(node -v) installed"
fi

# =============================================================================
# STEP 3: Install pnpm
# =============================================================================
echo ""
echo "Step 3: Installing pnpm..."
if command -v pnpm &> /dev/null; then
    print_warning "pnpm already installed: $(pnpm -v)"
else
    $SUDO npm install -g pnpm
    print_status "pnpm $(pnpm -v) installed"
fi

# =============================================================================
# STEP 4: Create Application Directory
# =============================================================================
echo ""
echo "Step 4: Setting up application directory..."
APP_DIR="/var/www/chess-websocket"

$SUDO mkdir -p $APP_DIR
$SUDO chown -R $USER:$USER $APP_DIR
print_status "Application directory created: $APP_DIR"

# =============================================================================
# STEP 5: Create environment file template
# =============================================================================
echo ""
echo "Step 5: Creating environment file template..."
if [ ! -f "$APP_DIR/.env" ]; then
    cat > $APP_DIR/.env << 'EOF'
# Chess WebSocket Server Environment Configuration
PORT=3002
NODE_ENV=production

# IMPORTANT: Update this to your web app URL (where your Next.js app is hosted)
WEB_APP_URL=https://your-web-app-url.com
EOF
    print_status "Environment file template created at $APP_DIR/.env"
    print_warning "Remember to update WEB_APP_URL in $APP_DIR/.env"
else
    print_warning "Environment file already exists, skipping..."
fi

# =============================================================================
# STEP 6: Configure Firewall (UFW)
# =============================================================================
echo ""
echo "Step 6: Configuring firewall..."
$SUDO ufw allow 22/tcp    # SSH
$SUDO ufw allow 3002/tcp  # WebSocket server
$SUDO ufw --force enable
print_status "Firewall configured (ports 22, 3002)"

# =============================================================================
# STEP 7: Create systemd service for the WebSocket server
# =============================================================================
echo ""
echo "Step 7: Creating systemd service..."
$SUDO tee /etc/systemd/system/chess-websocket.service > /dev/null << EOF
[Unit]
Description=Chess WebSocket Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=chess-websocket
Environment=NODE_ENV=production
EnvironmentFile=$APP_DIR/.env

[Install]
WantedBy=multi-user.target
EOF

$SUDO systemctl daemon-reload
$SUDO systemctl enable chess-websocket
print_status "Systemd service created and enabled"

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo ""
echo "1. Deploy application files to: $APP_DIR"
echo "   cd $APP_DIR"
echo "   # Upload or clone your application files"
echo ""
echo "2. Update environment variables:"
echo "   nano $APP_DIR/.env"
echo "   Set WEB_APP_URL to your Vercel app URL"
echo ""
echo "3. Install dependencies and build:"
echo "   cd $APP_DIR"
echo "   pnpm install"
echo "   pnpm run build"
echo ""
echo "4. Start the server:"
echo "   sudo systemctl start chess-websocket"
echo "   sudo systemctl status chess-websocket"
echo ""
echo "5. Verify health check:"
echo "   curl http://$(curl -s ifconfig.me):3002/health"
echo ""
print_status "Server setup complete!"
