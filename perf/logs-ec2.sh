#!/bin/bash
# Tail WebSocket server logs on the perf EC2 instance
# Usage: cd perf && bash logs-ec2.sh [lines]
# Example: bash logs-ec2.sh 100

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
set -a && source "$SCRIPT_DIR/.env" && set +a
EC2_KEY="${EC2_KEY_PATH/#\~/$HOME}"
LINES="${1:-50}"
ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" "sudo journalctl -u chess-websocket -n $LINES --no-pager"
