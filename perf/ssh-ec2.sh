#!/bin/bash
# Quick SSH into the perf EC2 instance
# Usage: cd perf && bash ssh-ec2.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
set -a && source "$SCRIPT_DIR/.env" && set +a
EC2_KEY="${EC2_KEY_PATH/#\~/$HOME}"
ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST"
