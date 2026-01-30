#!/bin/bash
# =============================================================================
# Chess WebSocket Server - Local Upload Script
# Run this from your LOCAL machine to upload files to EC2
# Usage: bash upload-to-server.sh <EC2-IP> <KEY-FILE>
# Example: bash upload-to-server.sh 54.123.45.67 ~/.ssh/my-key.pem
# =============================================================================

set -e

# Check arguments
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <EC2-IP> <KEY-FILE>"
    echo "Example: $0 54.123.45.67 ~/.ssh/my-key.pem"
    exit 1
fi

EC2_IP=$1
KEY_FILE=$2
EC2_USER="ubuntu"
REMOTE_DIR="/var/www/chess-websocket"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }

echo "=========================================="
echo "Uploading to EC2: $EC2_IP"
echo "=========================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "Source directory: $APP_DIR"

# Files to upload
FILES_TO_UPLOAD=(
    "index.ts"
    "GameManager.ts"
    "GameSession.ts"
    "ClockManager.ts"
    "types.ts"
    "tsconfig.production.json"
)

# Create directories on remote
echo ""
echo "Creating remote directories..."
ssh -i "$KEY_FILE" "$EC2_USER@$EC2_IP" "mkdir -p $REMOTE_DIR/utils $REMOTE_DIR/deploy"
print_status "Remote directories created"

# Upload main files
echo ""
echo "Uploading application files..."
for file in "${FILES_TO_UPLOAD[@]}"; do
    if [ -f "$APP_DIR/$file" ]; then
        scp -i "$KEY_FILE" "$APP_DIR/$file" "$EC2_USER@$EC2_IP:$REMOTE_DIR/"
        print_status "Uploaded: $file"
    else
        print_warning "File not found: $file"
    fi
done

# Upload production package.json (without workspace dependencies)
echo ""
echo "Uploading production package.json..."
scp -i "$KEY_FILE" "$SCRIPT_DIR/package.production.json" "$EC2_USER@$EC2_IP:$REMOTE_DIR/package.json"
print_status "Uploaded: package.json (production version)"

# Upload utils directory
echo ""
echo "Uploading utils..."
scp -i "$KEY_FILE" "$APP_DIR/utils/apiClient.ts" "$EC2_USER@$EC2_IP:$REMOTE_DIR/utils/"
print_status "Uploaded: utils/apiClient.ts"

# Upload deployment scripts
echo ""
echo "Uploading deployment scripts..."
scp -i "$KEY_FILE" "$APP_DIR/deploy/deploy-app.sh" "$EC2_USER@$EC2_IP:$REMOTE_DIR/deploy/"
print_status "Uploaded: deploy/deploy-app.sh"

# Check if .env exists on remote, if not create a template
echo ""
echo "Checking environment file..."
ssh -i "$KEY_FILE" "$EC2_USER@$EC2_IP" "
if [ ! -f $REMOTE_DIR/.env ]; then
    cat > $REMOTE_DIR/.env << 'EOF'
PORT=3002
NODE_ENV=production
WEB_APP_URL=https://your-vercel-app.vercel.app
EOF
    echo 'Created .env template - please update WEB_APP_URL'
else
    echo '.env file already exists'
fi
"

echo ""
echo "=========================================="
echo "Upload Complete!"
echo "=========================================="
echo ""
echo "Next Steps (on the EC2 server):"
echo ""
echo "1. SSH into the server:"
echo "   ssh -i $KEY_FILE $EC2_USER@$EC2_IP"
echo ""
echo "2. Navigate to app directory:"
echo "   cd $REMOTE_DIR"
echo ""
echo "3. Update environment variables:"
echo "   nano .env"
echo ""
echo "4. Run deployment script:"
echo "   bash deploy/deploy-app.sh"
echo ""
