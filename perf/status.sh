#!/bin/bash
# =============================================================================
# Check the status of the entire perf environment
# Verifies: Neon DB, Vercel app, EC2 WebSocket server, SSL
#
# Usage: cd perf && bash status.sh
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "ERROR: perf/.env not found."
    exit 1
fi
set -a && source "$SCRIPT_DIR/.env" && set +a

EC2_KEY="${EC2_KEY_PATH/#\~/$HOME}"
WS_DOMAIN="ws-perf.playchess.tech"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

pass() { echo -e "${GREEN}[OK]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }

echo "=== Perf Environment Status ==="
echo ""

# 1. Neon DB (strip channel_binding param that psql may not support)
echo "--- Neon Perf Database ---"
DB_URL=$(echo "$PERF_DATABASE_URL" | sed 's/&channel_binding=require//')
RESULT=$(psql "$DB_URL" -c "SELECT count(*) FROM legends" -t 2>/dev/null | tr -d ' ')
if [ -n "$RESULT" ]; then
    pass "Neon DB connected ($RESULT legends)"
else
    fail "Neon DB connection failed"
fi

TABLE_COUNT=$(psql "$DB_URL" -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'" -t 2>/dev/null | tr -d ' ')
echo "     Tables: $TABLE_COUNT"

# 2. Vercel app
echo ""
echo "--- Vercel Perf App ---"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PERF_WEB_APP_URL" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    pass "Vercel app responding ($PERF_WEB_APP_URL)"
else
    fail "Vercel app returned HTTP $HTTP_CODE"
fi

# 3. WebSocket server (via SSL)
echo ""
echo "--- EC2 WebSocket Server ---"
HEALTH=$(curl -s "https://$WS_DOMAIN/health" 2>/dev/null)
if echo "$HEALTH" | grep -q '"ok"'; then
    pass "WebSocket server healthy (https://$WS_DOMAIN)"
else
    fail "WebSocket server health check failed"
fi

# 4. EC2 service status
SSH_CMD="ssh -i $EC2_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=5 $EC2_USER@$EC2_HOST"
SERVICE_STATUS=$($SSH_CMD "sudo systemctl is-active chess-websocket" 2>/dev/null)
if [ "$SERVICE_STATUS" = "active" ]; then
    pass "systemd service active"
else
    fail "systemd service: $SERVICE_STATUS"
fi

MEMORY=$($SSH_CMD "sudo systemctl show chess-websocket --property=MemoryCurrent --value" 2>/dev/null)
echo "     Memory: $MEMORY"

# 5. SSL cert
echo ""
echo "--- SSL Certificate ---"
EXPIRY=$(echo | openssl s_client -servername "$WS_DOMAIN" -connect "$WS_DOMAIN:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "$EXPIRY" ]; then
    pass "SSL valid until: $EXPIRY"
else
    fail "Could not check SSL cert"
fi

echo ""
echo "=== Summary ==="
echo "Web App:    $PERF_WEB_APP_URL"
echo "WebSocket:  wss://$WS_DOMAIN"
echo "EC2:        $EC2_USER@$EC2_HOST"
echo "Neon DB:    chess_battle_perf (royal-math-49660639)"
