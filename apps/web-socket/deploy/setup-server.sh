#!/bin/bash
# =============================================================================
# Chess WebSocket Server - EC2 Setup Script
# Run this script on a fresh Ubuntu 22.04 EC2 instance
# Assumes repo is cloned at /var/www/chess-websocket
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

# Paths
REPO_DIR="/var/www/chess-websocket/chess-battle-turbo"
APP_DIR="$REPO_DIR/apps/web-socket"

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
# STEP 4: Create environment file template
# =============================================================================
echo ""
echo "Step 4: Creating environment file template..."
if [ ! -f "$APP_DIR/.env" ]; then
    cat > $APP_DIR/.env << 'EOF'
# Chess WebSocket Server Environment Configuration
PORT=3002
NODE_ENV=production

# Your Next.js app URL (for API calls)
WEB_APP_URL=https://chess-battle-turbo-web.vercel.app
EOF
    print_status "Environment file created at $APP_DIR/.env"
else
    print_warning "Environment file already exists, skipping..."
fi

# =============================================================================
# STEP 5: Configure Firewall (UFW)
# =============================================================================
echo ""
echo "Step 5: Configuring firewall..."
$SUDO ufw allow 22/tcp    # SSH
$SUDO ufw allow 3002/tcp  # WebSocket server
$SUDO ufw --force enable
print_status "Firewall configured (ports 22, 3002)"

# =============================================================================
# STEP 6: Create systemd service for the WebSocket server
# =============================================================================
echo ""
echo "Step 6: Creating systemd service..."
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
echo "1. Install dependencies and build:"
echo "   cd $APP_DIR"
echo "   pnpm install"
echo "   pnpm run build"
echo ""
echo "2. Start the server:"
echo "   sudo systemctl start chess-websocket"
echo "   sudo systemctl status chess-websocket"
echo ""
echo "3. Verify health check:"
echo "   curl http://localhost:3002/health"
echo ""
print_status "Server setup complete!"
