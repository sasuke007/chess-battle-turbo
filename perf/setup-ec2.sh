#!/bin/bash
# =============================================================================
# Setup the perf WebSocket server on a fresh EC2 instance
# Installs Node 22, pnpm, Nginx, Certbot, configures systemd service
#
# Usage: cd perf && bash setup-ec2.sh
# Prereqs: EC2 instance running, DNS A record for WS_DOMAIN pointing to EC2_HOST
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load env
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "ERROR: perf/.env not found. Copy .env.example and fill in values."
    exit 1
fi
set -a && source "$SCRIPT_DIR/.env" && set +a

EC2_KEY="${EC2_KEY_PATH/#\~/$HOME}"
WS_DOMAIN="ws-perf.playchess.tech"
REPO_URL="https://github.com/replay-chess/chess-battle-turbo.git"
REPO_DIR="/var/www/chess-websocket/chess-battle-turbo"
APP_DIR="$REPO_DIR/apps/web-socket"

SSH_CMD="ssh -i $EC2_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST"

echo "=== Perf WebSocket Server Setup ==="
echo "Host: $EC2_HOST"
echo "Domain: $WS_DOMAIN"
echo ""

# Step 1: System packages
echo "--- Step 1: System packages ---"
$SSH_CMD "sudo apt update -y && sudo apt upgrade -y" 2>&1 | tail -3

# Step 2: Node.js 22
echo "--- Step 2: Node.js 22 ---"
$SSH_CMD "command -v node > /dev/null 2>&1 && echo 'Node already installed: '\$(node -v) || (curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs && echo 'Installed Node '\$(node -v))"

# Step 3: pnpm
echo "--- Step 3: pnpm ---"
$SSH_CMD "command -v pnpm > /dev/null 2>&1 && echo 'pnpm already installed: '\$(pnpm -v) || (sudo npm install -g pnpm && echo 'Installed pnpm '\$(pnpm -v))"

# Step 4: Nginx + Certbot
echo "--- Step 4: Nginx + Certbot ---"
$SSH_CMD "sudo apt install -y nginx certbot python3-certbot-nginx" 2>&1 | tail -3

# Step 5: Clone repo
echo "--- Step 5: Clone repo ---"
$SSH_CMD "if [ -d '$REPO_DIR' ]; then echo 'Repo already cloned, pulling latest...'; cd $REPO_DIR && git pull origin main; else sudo mkdir -p /var/www/chess-websocket && sudo chown -R \$USER:\$USER /var/www && git clone $REPO_URL $REPO_DIR; fi"

# Step 6: Install deps + build
echo "--- Step 6: Install deps + build ---"
$SSH_CMD "cd $APP_DIR && pnpm install && pnpm run build && echo 'Build OK: '\$(ls dist/index.js)"

# Step 7: Create .env
echo "--- Step 7: Create .env ---"
$SSH_CMD "cat > $APP_DIR/.env << 'ENVEOF'
PORT=3002
NODE_ENV=production
WEB_APP_URL=$PERF_WEB_APP_URL
ENVEOF
cat $APP_DIR/.env"

# Step 8: Nginx config
echo "--- Step 8: Nginx config ---"
$SSH_CMD "sudo tee /etc/nginx/sites-available/chess-websocket.conf > /dev/null << 'NGINXEOF'
upstream websocket_backend {
    server 127.0.0.1:3002;
    keepalive 64;
}

server {
    listen 80;
    server_name $WS_DOMAIN;

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
        proxy_set_header Connection \"upgrade\";
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
        proxy_set_header Connection \"upgrade\";
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
sudo ln -sf /etc/nginx/sites-available/chess-websocket.conf /etc/nginx/sites-enabled/chess-websocket.conf && sudo rm -f /etc/nginx/sites-enabled/default && sudo nginx -t && sudo systemctl restart nginx && echo 'Nginx OK'"

# Step 9: Firewall
echo "--- Step 9: Firewall ---"
$SSH_CMD "sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw --force enable" 2>&1 | tail -3

# Step 10: Systemd service
echo "--- Step 10: Systemd service ---"
$SSH_CMD "sudo tee /etc/systemd/system/chess-websocket.service > /dev/null << 'SVCEOF'
[Unit]
Description=Chess WebSocket Server (Perf)
After=network.target

[Service]
Type=simple
User=ubuntu
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
SVCEOF
sudo systemctl daemon-reload && sudo systemctl enable chess-websocket && sudo systemctl restart chess-websocket && sleep 2 && echo 'Service status:' && sudo systemctl is-active chess-websocket"

# Step 11: SSL
echo "--- Step 11: SSL ---"
$SSH_CMD "sudo certbot --nginx -d $WS_DOMAIN --non-interactive --agree-tos --email pandit.rohit0007@gmail.com --redirect" 2>&1 | tail -5

# Step 12: Verify
echo ""
echo "=== Verification ==="
curl -s "https://$WS_DOMAIN/health"
echo ""
echo ""
echo "=== Setup complete ==="
echo "WebSocket server: wss://$WS_DOMAIN"
echo "Health check:     https://$WS_DOMAIN/health"
