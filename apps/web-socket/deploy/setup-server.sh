#!/bin/bash
# =============================================================================
# Chess WebSocket Server - EC2 Setup Script
# Run this script on a fresh Ubuntu 22.04 EC2 instance
# Assumes repo is cloned at /var/www/chess-websocket
# Usage: bash setup-server.sh
# =============================================================================

set -e  # Exit on error

DOMAIN="ws-chess.playchess.tech"

echo "=========================================="
echo "Chess WebSocket Server Setup"
echo "Domain: $DOMAIN"
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
WEB_APP_URL=https://playchess.tech
EOF
    print_status "Environment file created at $APP_DIR/.env"
else
    print_warning "Environment file already exists, skipping..."
fi

# =============================================================================
# STEP 5: Install Nginx and Certbot
# =============================================================================
echo ""
echo "Step 5: Installing Nginx and Certbot..."
$SUDO apt install -y nginx certbot python3-certbot-nginx
print_status "Nginx and Certbot installed"

# =============================================================================
# STEP 6: Configure Nginx for WebSocket reverse proxy
# =============================================================================
echo ""
echo "Step 6: Configuring Nginx for $DOMAIN..."
NGINX_CONF="/etc/nginx/sites-available/chess-websocket.conf"

# Start with HTTP-only config — Certbot will add the SSL server block automatically
$SUDO tee $NGINX_CONF > /dev/null << NGINXEOF
upstream websocket_backend {
    server 127.0.0.1:3002;
    keepalive 64;
}

server {
    listen 80;
    server_name $DOMAIN;

    location /health {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_buffering off;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    location /socket.io/ {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_buffering off;
    }
}
NGINXEOF

print_status "Nginx HTTP config created for $DOMAIN"

# Enable site and remove default
$SUDO ln -sf $NGINX_CONF /etc/nginx/sites-enabled/chess-websocket.conf
$SUDO rm -f /etc/nginx/sites-enabled/default

# Test and start Nginx (HTTP only — no SSL yet)
$SUDO nginx -t && $SUDO systemctl restart nginx
print_status "Nginx started (HTTP only, SSL will be added by Certbot)"

# =============================================================================
# STEP 7: Configure Firewall (UFW)
# =============================================================================
echo ""
echo "Step 7: Configuring firewall..."
$SUDO ufw allow 22/tcp    # SSH
$SUDO ufw allow 80/tcp    # HTTP (for Certbot verification + redirect)
$SUDO ufw allow 443/tcp   # HTTPS (Nginx SSL termination)
$SUDO ufw --force enable
print_status "Firewall configured (ports 22, 80, 443)"

# =============================================================================
# STEP 8: Create systemd service for the WebSocket server
# =============================================================================
echo ""
echo "Step 8: Creating systemd service..."
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
# STEP 9: Install dependencies, build, and start WebSocket server
# =============================================================================
echo ""
echo "Step 9: Installing dependencies and building..."
cd $APP_DIR
pnpm install
pnpm run build
print_status "Dependencies installed and app built"

$SUDO systemctl start chess-websocket
print_status "WebSocket server started"

# Verify it's running before getting SSL
sleep 2
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    print_status "WebSocket server health check passed"
else
    print_error "WebSocket server health check failed — check logs: sudo journalctl -u chess-websocket -n 50"
    exit 1
fi

# =============================================================================
# STEP 10: Get SSL certificate with Certbot
# =============================================================================
echo ""
echo "Step 10: Getting SSL certificate for $DOMAIN..."
echo ""
print_warning "Make sure the DNS A record for $DOMAIN points to this server's IP"
print_warning "Certbot will ask for your email and to agree to terms"
print_warning "When asked about redirect, choose option 2 (redirect HTTP to HTTPS)"
echo ""

# Certbot will:
# 1. Verify domain ownership via HTTP challenge (needs port 80 + Nginx running)
# 2. Obtain SSL certificate from Let's Encrypt
# 3. Automatically modify Nginx config to add 443 SSL server block
# 4. Add HTTP→HTTPS redirect
$SUDO certbot --nginx -d $DOMAIN

# Restart nginx with the new SSL config
$SUDO nginx -t && $SUDO systemctl restart nginx
print_status "SSL certificate installed and Nginx restarted"

# =============================================================================
# STEP 11: Verify everything
# =============================================================================
echo ""
echo "Step 11: Running verification checks..."

# Check WebSocket server
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    print_status "WebSocket server (direct): OK"
else
    print_error "WebSocket server (direct): FAILED"
fi

# Check through Nginx + SSL
if curl -s https://$DOMAIN/health > /dev/null 2>&1; then
    print_status "Nginx + SSL ($DOMAIN): OK"
else
    print_warning "Nginx + SSL ($DOMAIN): could not verify (DNS may still be propagating)"
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Your WebSocket server is running at: wss://$DOMAIN"
echo ""
echo "Remaining manual step:"
echo ""
echo "  1. Make sure your EC2 Security Group allows inbound ports 80 and 443"
echo "     (AWS Console → EC2 → Security Groups → Edit inbound rules)"
echo ""
echo "  2. Set Vercel env var:"
echo "     NEXT_PUBLIC_WEBSOCKET_URL=wss://$DOMAIN"
echo "     (must be wss://, not ws://)"
echo ""
echo "  3. Redeploy your Vercel app"
echo ""
print_status "All done!"
