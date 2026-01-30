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
# STEP 4: Install Nginx
# =============================================================================
echo ""
echo "Step 4: Installing Nginx..."
if command -v nginx &> /dev/null; then
    print_warning "Nginx already installed"
else
    $SUDO apt install -y nginx
    print_status "Nginx installed"
fi

# =============================================================================
# STEP 5: Install Certbot
# =============================================================================
echo ""
echo "Step 5: Installing Certbot..."
if command -v certbot &> /dev/null; then
    print_warning "Certbot already installed"
else
    $SUDO apt install -y certbot python3-certbot-nginx
    print_status "Certbot installed"
fi

# =============================================================================
# STEP 6: Create Application Directory
# =============================================================================
echo ""
echo "Step 6: Setting up application directory..."
APP_DIR="/var/www/chess-websocket"

$SUDO mkdir -p $APP_DIR
$SUDO chown -R $USER:$USER $APP_DIR
print_status "Application directory created: $APP_DIR"

# =============================================================================
# STEP 7: Create environment file template
# =============================================================================
echo ""
echo "Step 7: Creating environment file template..."
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
# STEP 8: Configure Firewall (UFW)
# =============================================================================
echo ""
echo "Step 8: Configuring firewall..."
$SUDO ufw allow 22/tcp   # SSH
$SUDO ufw allow 80/tcp   # HTTP
$SUDO ufw allow 443/tcp  # HTTPS
$SUDO ufw --force enable
print_status "Firewall configured (ports 22, 80, 443)"

# =============================================================================
# STEP 9: Configure Nginx
# =============================================================================
echo ""
echo "Step 9: Setting up Nginx configuration..."
NGINX_CONF="/etc/nginx/sites-available/chess-websocket"

if [ ! -f "$NGINX_CONF" ]; then
    $SUDO tee $NGINX_CONF > /dev/null << 'EOF'
# Chess WebSocket Server Nginx Configuration
# Replace ws.yourdomain.com with your actual subdomain

upstream websocket_backend {
    server 127.0.0.1:3002;
    keepalive 64;
}

server {
    listen 80;
    server_name ws.yourdomain.com;

    location / {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_buffering off;
    }
}
EOF
    print_status "Nginx configuration created at $NGINX_CONF"
    print_warning "Remember to update 'ws.yourdomain.com' in $NGINX_CONF"
else
    print_warning "Nginx configuration already exists, skipping..."
fi

# =============================================================================
# STEP 10: Enable Nginx site
# =============================================================================
echo ""
echo "Step 10: Enabling Nginx site..."
if [ ! -L "/etc/nginx/sites-enabled/chess-websocket" ]; then
    $SUDO ln -s /etc/nginx/sites-available/chess-websocket /etc/nginx/sites-enabled/
fi

# Remove default site if it exists
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    $SUDO rm /etc/nginx/sites-enabled/default
fi

$SUDO nginx -t && $SUDO systemctl restart nginx
print_status "Nginx configured and restarted"

# =============================================================================
# STEP 11: Create systemd service for the WebSocket server
# =============================================================================
echo ""
echo "Step 11: Creating systemd service..."
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
echo "1. Update DNS: Point your subdomain to this server's IP"
echo "   Add an A record: ws.yourdomain.com -> $(curl -s ifconfig.me)"
echo ""
echo "2. Update Nginx config with your domain:"
echo "   sudo nano /etc/nginx/sites-available/chess-websocket"
echo "   Replace 'ws.yourdomain.com' with your actual subdomain"
echo "   sudo nginx -t && sudo systemctl restart nginx"
echo ""
echo "3. Deploy application files to: $APP_DIR"
echo "   cd $APP_DIR"
echo "   # Upload or clone your application files"
echo ""
echo "4. Update environment variables:"
echo "   nano $APP_DIR/.env"
echo "   Set WEB_APP_URL to your Vercel app URL"
echo ""
echo "5. Install dependencies and build:"
echo "   cd $APP_DIR"
echo "   pnpm install"
echo "   pnpm run build"
echo ""
echo "6. Start the server:"
echo "   sudo systemctl start chess-websocket"
echo "   sudo systemctl status chess-websocket"
echo ""
echo "7. Install SSL certificate (after DNS propagation):"
echo "   sudo certbot --nginx -d ws.yourdomain.com"
echo ""
echo "8. Verify health check:"
echo "   curl https://ws.yourdomain.com/health"
echo ""
print_status "Server setup complete!"
