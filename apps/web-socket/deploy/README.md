# Chess WebSocket Server - AWS EC2 Deployment Guide

Deploy the chess WebSocket server to a dedicated EC2 instance with Node.js, systemd, Nginx, and SSL.

## Prerequisites

- AWS Account
- Domain name (for SSL certificate)
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
     | Type  | Port | Source         |
     |-------|------|----------------|
     | SSH   | 22   | Your IP        |
     | HTTP  | 80   | 0.0.0.0/0      |
     | HTTPS | 443  | 0.0.0.0/0      |
   - **Storage**: 8GB gp3 (default)

3. Launch instance

### Step 2: Allocate Elastic IP

1. EC2 → Elastic IPs → Allocate Elastic IP
2. Associate with your instance
3. Note the IP address (e.g., `54.xxx.xxx.xxx`)

### Step 3: Configure DNS

Add an A record pointing your subdomain to the Elastic IP:

| Type | Name | Value          | TTL  |
|------|------|----------------|------|
| A    | ws   | `<ELASTIC-IP>` | 300  |

Wait for DNS propagation (5-15 minutes).

### Step 4: Setup Server

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@<ELASTIC-IP>

# Download and run setup script
curl -sL https://raw.githubusercontent.com/sasuke007/chess-battle-turbo/main/apps/web-socket/deploy/setup-server.sh | bash

# Or clone the repo and run locally
git clone https://github.com/sasuke007/chess-battle-turbo.git
bash chess-battle-turbo/apps/web-socket/deploy/setup-server.sh
```

### Step 5: Upload Application (from local machine)

```bash
cd apps/web-socket/deploy
bash upload-to-server.sh <ELASTIC-IP> ~/.ssh/your-key.pem
```

### Step 6: Deploy Application (on server)

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

### Step 7: Update Nginx Configuration

```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/chess-websocket

# Replace 'ws.yourdomain.com' with your actual subdomain

# Test and restart Nginx
sudo nginx -t && sudo systemctl restart nginx
```

### Step 8: Install SSL Certificate

```bash
# Install SSL (after DNS propagation)
sudo certbot --nginx -d ws.yourdomain.com

# Follow prompts, select "redirect HTTP to HTTPS"
```

### Step 9: Verify Deployment

```bash
# Health check
curl https://ws.yourdomain.com/health
# Expected: {"status":"ok","message":"WebSocket server is running"}

# Check service status
sudo systemctl status chess-websocket

# View logs
sudo journalctl -u chess-websocket -f
```

### Step 10: Update Vercel Environment

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - **Name**: `NEXT_PUBLIC_WEBSOCKET_URL`
   - **Value**: `wss://ws.yourdomain.com`
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
├── nginx/
│   └── chess-websocket.conf # Nginx config template
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
| `PORT`       | Server port (proxied by Nginx)     | `3002`                            |
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

# Nginx Commands
sudo nginx -t                 # Test configuration
sudo systemctl restart nginx  # Restart Nginx
sudo systemctl status nginx   # Check status

# SSL Commands
sudo certbot renew --dry-run  # Test SSL renewal
sudo certbot certificates     # List certificates
```

## Troubleshooting

### WebSocket connection fails
- Check security group has port 443 open
- Verify Nginx is running: `sudo systemctl status nginx`
- Check service: `sudo systemctl status chess-websocket`
- Check logs: `sudo journalctl -u chess-websocket -f`

### Certbot fails
- Ensure DNS is propagated: `dig ws.yourdomain.com`
- Ensure port 80 is open in security group
- Check domain resolves: `curl http://ws.yourdomain.com/health`

### CORS errors
- The server allows all origins by default
- Check logs for specific errors

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
5. Consider using AWS WAF for additional protection
