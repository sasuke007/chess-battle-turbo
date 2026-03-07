#!/bin/bash
# =============================================================================
# Seed the perf Neon database with reference data from prod
# Runs Prisma migrations + copies openings, legends, chess_positions, bot user
#
# Usage: cd perf && bash seed-perf-db.sh
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load env
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "ERROR: perf/.env not found. Copy .env.example and fill in values."
    exit 1
fi
set -a && source "$SCRIPT_DIR/.env" && set +a

echo "=== Step 1: Run Prisma migrations ==="
cd "$ROOT_DIR/apps/web"
DATABASE_URL="$PERF_DIRECT_URL" npx prisma db push --accept-data-loss --skip-generate
echo "Schema pushed successfully."

echo ""
echo "=== Step 2: Seed reference data from prod ==="
PROD_DATABASE_URL="$PROD_DATABASE_URL" \
PERF_DATABASE_URL="$PERF_DATABASE_URL" \
npx tsx "$ROOT_DIR/scripts/seed-perf-db.ts"

echo ""
echo "=== Perf DB seeding complete ==="
