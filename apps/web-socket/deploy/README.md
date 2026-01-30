# Chess WebSocket Server - AWS EC2 Deployment Guide

Deploy the chess WebSocket server to a dedicated EC2 instance with Node.js and systemd.

## Prerequisites

- AWS Account
- SSH key pair for EC2

## Quick Start

### Step 1: Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Configure:
   - **Name**: `chess-websocket-server`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance type**: `t3.micro` (free tier eligible)
   - **Key pair**: Create new or select existing
   - **Security Group**: Create with these inbound rules:
     | Type   | Port | Source         |
     |--------|------|----------------|
     | SSH    | 22   | Your IP        |
     | Custom | 3002 | 0.0.0.0/0      |
   - **Storage**: 8GB gp3 (default)

3. Launch instance

### Step 2: Allocate Elastic IP

1. EC2 → Elastic IPs → Allocate Elastic IP
2. Associate with your instance
3. Note the IP address (e.g., `54.xxx.xxx.xxx`)

### Step 3: Setup Server

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@<ELASTIC-IP>

# Clone the repository
cd /var/www
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
git clone https://github.com/sasuke007/chess-battle-turbo.git chess-websocket

# Run setup script
bash /var/www/chess-websocket/apps/web-socket/deploy/setup-server.sh
```

### Step 4: Deploy Application

```bash
cd /var/www/chess-websocket/apps/web-socket

# Install dependencies and build
pnpm install
pnpm run build

# Start the service
sudo systemctl start chess-websocket
```

### Step 5: Verify Deployment

```bash
# Health check
curl http://localhost:3002/health
# Expected: {"status":"ok","message":"WebSocket server is running"}

# Check service status
sudo systemctl status chess-websocket

# View logs
sudo journalctl -u chess-websocket -f
```

### Step 6: Update Vercel Environment

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - **Name**: `NEXT_PUBLIC_WEBSOCKET_URL`
   - **Value**: `ws://<ELASTIC-IP>:3002`
   - **Environment**: Production
3. Redeploy your app

---

## CI/CD Auto-Deploy

Once set up, pushing to `main` will auto-deploy. See `.github/workflows/deploy-websocket.yml`.

**Required GitHub Secrets:**

| Secret | Value |
|--------|-------|
| `EC2_SSH_KEY` | Your EC2 private key (`.pem` file contents) |
| `EC2_HOST` | Your EC2 Elastic IP |
| `EC2_USER` | `ubuntu` |

---

## Manual Deployment (after initial setup)

```bash
ssh -i your-key.pem ubuntu@<ELASTIC-IP>
cd /var/www/chess-websocket
git pull origin main
cd apps/web-socket
pnpm install
pnpm run build
sudo systemctl restart chess-websocket
```

---

## Environment Variables

| Variable     | Description                        | Example                           |
|--------------|------------------------------------|-----------------------------------|
| `PORT`       | Server port                        | `3002`                            |
| `NODE_ENV`   | Environment                        | `production`                      |
| `WEB_APP_URL`| Your Next.js app URL (for API calls)| `https://chess-battle-turbo-web.vercel.app` |

---

## Useful Commands

```bash
# Service Commands
sudo systemctl status chess-websocket   # Check status
sudo systemctl start chess-websocket    # Start
sudo systemctl stop chess-websocket     # Stop
sudo systemctl restart chess-websocket  # Restart
sudo journalctl -u chess-websocket -f   # View logs (follow)
sudo journalctl -u chess-websocket -n 100  # View last 100 lines
```

---

## Troubleshooting

### WebSocket connection fails
- Check security group has port 3002 open
- Check service: `sudo systemctl status chess-websocket`
- Check logs: `sudo journalctl -u chess-websocket -f`

### Application crashes
- Check logs: `sudo journalctl -u chess-websocket -n 100`
- Verify .env file has correct values
- Ensure WEB_APP_URL is accessible from the server
