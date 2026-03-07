#!/bin/bash
# =============================================================================
# Deploy latest code to the perf EC2 WebSocket server
# Pulls latest from main, rebuilds, and restarts the service
#
# Usage: cd perf && bash deploy-ec2.sh
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load env
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "ERROR: perf/.env not found."
    exit 1
fi
set -a && source "$SCRIPT_DIR/.env" && set +a

EC2_KEY="${EC2_KEY_PATH/#\~/$HOME}"
REPO_DIR="/var/www/chess-websocket/chess-battle-turbo"
APP_DIR="$REPO_DIR/apps/web-socket"

SSH_CMD="ssh -i $EC2_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST"

echo "=== Deploying to perf EC2 ($EC2_HOST) ==="

$SSH_CMD << REMOTEOF
set -e
cd $REPO_DIR
echo "Pulling latest..."
git pull origin main

cd $APP_DIR
echo "Installing deps..."
pnpm install

echo "Building..."
pnpm run build

if [ ! -f "dist/index.js" ]; then
    echo "ERROR: Build failed - dist/index.js not found"
    exit 1
fi

echo "Restarting service..."
sudo systemctl restart chess-websocket
sleep 2

if sudo systemctl is-active --quiet chess-websocket; then
    echo "Service is running"
    curl -s http://localhost:3002/health
    echo ""
else
    echo "ERROR: Service failed to start"
    sudo journalctl -u chess-websocket -n 20 --no-pager
    exit 1
fi
REMOTEOF

echo ""
echo "=== Deploy complete ==="
