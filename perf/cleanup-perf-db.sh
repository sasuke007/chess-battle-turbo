#!/bin/bash
# =============================================================================
# Clean up perf DB between test runs
# Deletes all transient data (games, tournaments, matchmaking, transactions)
# Preserves: users, wallets (reset balances), user_stats (reset), reference data
#
# Usage: cd perf && bash cleanup-perf-db.sh
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "ERROR: perf/.env not found."
    exit 1
fi
set -a && source "$SCRIPT_DIR/.env" && set +a

echo "=== Cleaning perf database ==="
echo "This will delete all games, tournaments, matchmaking entries, and transactions."
echo "Users, wallets, and reference data will be preserved (stats/wallets reset)."
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

DB_URL=$(echo "$PERF_DATABASE_URL" | sed 's/&channel_binding=require//')
psql "$DB_URL" << 'SQL'
BEGIN;

-- Delete transient data (order matters for FK constraints)
DELETE FROM transactions;
DELETE FROM tournament_participants;
DELETE FROM games;
DELETE FROM tournaments;
DELETE FROM matchmaking_queue;

-- Reset wallets (keep users, zero out balances)
UPDATE wallets SET balance = 0, locked_amount = 0;

-- Reset user stats
UPDATE user_stats SET
    total_games_played = 0,
    games_won = 0,
    games_lost = 0,
    games_drawn = 0,
    total_money_won = 0,
    total_money_lost = 0,
    total_platform_fees_paid = 0,
    net_profit = 0,
    current_win_streak = 0,
    longest_win_streak = 0,
    average_game_duration = NULL,
    last_played_at = NULL;

COMMIT;

-- Report
SELECT 'games' as table_name, count(*) as rows FROM games
UNION ALL SELECT 'tournaments', count(*) FROM tournaments
UNION ALL SELECT 'tournament_participants', count(*) FROM tournament_participants
UNION ALL SELECT 'matchmaking_queue', count(*) FROM matchmaking_queue
UNION ALL SELECT 'transactions', count(*) FROM transactions
UNION ALL SELECT 'users', count(*) FROM users
UNION ALL SELECT 'legends', count(*) FROM legends
UNION ALL SELECT 'openings', count(*) FROM openings
UNION ALL SELECT 'chess_positions', count(*) FROM chess_positions;
SQL

echo ""
echo "=== Cleanup complete ==="
