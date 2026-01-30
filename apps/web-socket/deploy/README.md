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

# Download and run setup script
curl -sL https://raw.githubusercontent.com/sasuke007/chess-battle-turbo/main/apps/web-socket/deploy/setup-server.sh | bash

# Or clone the repo and run locally
git clone https://github.com/sasuke007/chess-battle-turbo.git
bash chess-battle-turbo/apps/web-socket/deploy/setup-server.sh
```

### Step 4: Upload Application (from local machine)

```bash
cd apps/web-socket/deploy
bash upload-to-server.sh <ELASTIC-IP> ~/.ssh/your-key.pem
```

### Step 5: Deploy Application (on server)

```bash
ssh -i your-key.pem ubuntu@<ELASTIC-IP>

# Update environment file
cd /var/www/chess-websocket
nano .env
# Set WEB_APP_URL to your Vercel app URL

# Run deployment
bash deploy/deploy-app.sh

# Or manually:
pnpm install
pnpm run build
sudo systemctl start chess-websocket
```

### Step 6: Verify Deployment

```bash
# Health check
curl http://<ELASTIC-IP>:3002/health
# Expected: {"status":"ok","message":"WebSocket server is running"}

# Check service status
sudo systemctl status chess-websocket

# View logs
sudo journalctl -u chess-websocket -f
```

### Step 7: Update Vercel Environment

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - **Name**: `NEXT_PUBLIC_WEBSOCKET_URL`
   - **Value**: `ws://<ELASTIC-IP>:3002`
   - **Environment**: Production
3. Redeploy your app

## File Structure

```
apps/web-socket/
├── index.ts                 # Main server
├── GameManager.ts           # Game session management
├── GameSession.ts           # Individual game logic
├── ClockManager.ts          # Chess clock
├── types.ts                 # TypeScript types
├── utils/
│   └── apiClient.ts         # API client
├── package.json             # Dependencies
├── tsconfig.production.json # Production TS config
└── deploy/
    ├── README.md            # This file
    ├── setup-server.sh      # Server setup script
    ├── deploy-app.sh        # Application deployment script
    ├── upload-to-server.sh  # Local upload script
    └── package.production.json # Standalone package.json
```

## Environment Variables

| Variable     | Description                        | Example                           |
|--------------|------------------------------------|-----------------------------------|
| `PORT`       | Server port                        | `3002`                            |
| `NODE_ENV`   | Environment                        | `production`                      |
| `WEB_APP_URL`| Your Next.js app URL (for API calls)| `https://your-app.vercel.app`    |

## Useful Commands

```bash
# Service Commands (systemd)
sudo systemctl status chess-websocket   # Check status
sudo systemctl start chess-websocket    # Start
sudo systemctl stop chess-websocket     # Stop
sudo systemctl restart chess-websocket  # Restart
sudo journalctl -u chess-websocket -f   # View logs (follow)
sudo journalctl -u chess-websocket -n 100  # View last 100 log lines
```

## Troubleshooting

### WebSocket connection fails
- Check security group has port 3002 open
- Check service: `sudo systemctl status chess-websocket`
- Check logs: `sudo journalctl -u chess-websocket -f`

### Application crashes
- Check logs: `sudo journalctl -u chess-websocket -n 100`
- Verify .env file has correct values
- Ensure WEB_APP_URL is accessible from the server

## Cost Estimate

| Resource              | Monthly Cost       |
|-----------------------|-------------------|
| t3.micro (free tier)  | $0 - $8.50        |
| t3.small              | ~$17              |
| Elastic IP (attached) | $0                |
| Data transfer         | ~$0.09/GB         |

## Security Recommendations

1. Restrict SSH access to your IP only
2. Enable automatic security updates: `sudo apt install unattended-upgrades`
3. Monitor logs regularly
4. Set up CloudWatch alarms for instance health
