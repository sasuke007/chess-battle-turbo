# Perf Environment

Dedicated performance testing environment for Chess Battle Turbo.

## Infrastructure

| Component | URL / Address |
|-----------|---------------|
| **Web App** | https://chess-battle-perf.vercel.app |
| **WebSocket** | wss://ws-perf.playchess.tech |
| **EC2** | 3.94.8.101 (t3.medium, Ubuntu 24.04) |
| **Neon DB** | chess_battle_perf (project: royal-math-49660639) |

## Scripts

| Script | Description |
|--------|-------------|
| `setup-ec2.sh` | Full EC2 setup from scratch (Node, pnpm, Nginx, SSL, systemd) |
| `deploy-ec2.sh` | Pull latest code, rebuild, restart WS service |
| `seed-perf-db.sh` | Run migrations + seed reference data from prod |
| `cleanup-perf-db.sh` | Reset transient data between test runs |
| `status.sh` | Check health of all perf components |
| `ssh-ec2.sh` | Quick SSH into EC2 |
| `logs-ec2.sh` | Tail WS server logs (pass line count as arg) |

## Quick Start

```bash
cd perf

# 1. Copy and fill in environment
cp .env.example .env

# 2. First-time setup (skip if already done)
bash setup-ec2.sh       # EC2 + Nginx + SSL
bash seed-perf-db.sh    # DB migrations + reference data

# 3. Check everything is healthy
bash status.sh

# 4. After code changes
bash deploy-ec2.sh

# 5. Between test runs
bash cleanup-perf-db.sh

# 6. Debugging
bash logs-ec2.sh 100
bash ssh-ec2.sh
```

## Vercel Perf App

Deployed as a separate Vercel project pointing to the perf DB and WS server.
Environment variables set in Vercel dashboard:

- `DATABASE_URL` -> perf Neon pooler URL
- `DIRECT_URL` -> perf Neon direct URL
- `NEXT_PUBLIC_WEBSOCKET_URL` -> `wss://ws-perf.playchess.tech`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` -> same dev Clerk instance
- `CLERK_SECRET_KEY` -> same dev Clerk instance
