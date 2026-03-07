/**
 * Generate DB-only users for large-scale perf testing (no Clerk accounts needed).
 *
 * Creates users directly in the Neon perf DB with wallets and stats,
 * then writes a user-manifest.json compatible with k6 scenarios.
 *
 * Usage:
 *   cd perf/k6
 *   npx tsx setup/generate-db-users.ts              # default 20,000 users
 *   npx tsx setup/generate-db-users.ts 1000         # custom count
 *   npx tsx setup/generate-db-users.ts 20000 --dry  # preview SQL, no DB writes
 *
 * Requires PERF_DATABASE_URL in perf/.env
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const manifestPath = resolve(__dirname, 'user-manifest.json');
const envPath = resolve(__dirname, '../../.env');

// --- Config ---
const DEFAULT_USER_COUNT = 20_000;
const BATCH_SIZE = 500; // Users per SQL batch (avoid query size limits)
const WALLET_BALANCE = 1_000_000; // Enough for thousands of games

// --- Parse args ---
const userCount = parseInt(process.argv[2] || String(DEFAULT_USER_COUNT), 10);
const dryRun = process.argv.includes('--dry');

if (isNaN(userCount) || userCount < 2 || userCount % 2 !== 0) {
  console.error('ERROR: User count must be an even number >= 2');
  process.exit(1);
}

// --- Load DB URL ---
if (!existsSync(envPath)) {
  console.error('ERROR: perf/.env not found.');
  process.exit(1);
}

const envContent = readFileSync(envPath, 'utf-8');
function getEnv(key: string): string {
  const line = envContent.split('\n').find((l) => l.startsWith(`${key}=`));
  return line?.split('=').slice(1).join('=').replace(/['"]/g, '') || '';
}

const dbUrl = getEnv('PERF_DATABASE_URL').replace('&channel_binding=require', '');
if (!dbUrl && !dryRun) {
  console.error('ERROR: PERF_DATABASE_URL not in perf/.env');
  process.exit(1);
}

// --- Helpers ---
function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `cl${timestamp}${random}`;
}

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

interface ManifestEntry {
  clerkId: string;
  email: string;
  referenceId: string;
  token?: string;
}

// --- Main ---
async function main() {
  console.log(`Generating ${userCount} DB-only users (${userCount / 2} VU pairs)...`);
  if (dryRun) console.log('DRY RUN — no DB writes\n');

  const padWidth = String(userCount - 1).length;
  const manifest: ManifestEntry[] = [];

  // Generate all user records
  const users: {
    referenceId: string;
    email: string;
    name: string;
    code: string;
    walletRefId: string;
    statsRefId: string;
  }[] = [];

  for (let i = 0; i < userCount; i++) {
    const refId = generateCuid();
    users.push({
      referenceId: refId,
      email: `perfscale-${pad(i, padWidth)}@chessbattle.dev`,
      name: `PerfScale${pad(i, padWidth)}`,
      code: generateCode(),
      walletRefId: generateCuid(),
      statsRefId: generateCuid(),
    });
    manifest.push({
      clerkId: `perf_db_${pad(i, padWidth)}`,
      email: `perfscale-${pad(i, padWidth)}@chessbattle.dev`,
      referenceId: refId,
    });
  }

  if (dryRun) {
    console.log('Sample manifest entries:');
    console.log(JSON.stringify(manifest.slice(0, 4), null, 2));
    console.log(`... (${manifest.length} total)\n`);
    console.log('Sample SQL (first batch):');
    console.log(buildBatchSql(users.slice(0, 3)).substring(0, 2000));
    return;
  }

  // Insert in batches
  let inserted = 0;
  let skipped = 0;
  let failed = 0;
  const totalBatches = Math.ceil(users.length / BATCH_SIZE);

  for (let batch = 0; batch < totalBatches; batch++) {
    const start = batch * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, users.length);
    const batchUsers = users.slice(start, end);
    const sql = buildBatchSql(batchUsers);

    try {
      execSync(`psql "${dbUrl}" -c "${sql.replace(/"/g, '\\"')}" 2>&1`, {
        encoding: 'utf-8',
        timeout: 60_000,
      });
      inserted += batchUsers.length;
    } catch (err: any) {
      const stderr = err.stderr || err.stdout || '';
      if (stderr.includes('duplicate') || stderr.includes('already exists')) {
        skipped += batchUsers.length;
      } else {
        console.error(`  Batch ${batch + 1}/${totalBatches} FAILED: ${stderr.substring(0, 200)}`);
        failed += batchUsers.length;
      }
    }

    if ((batch + 1) % 10 === 0 || batch === totalBatches - 1) {
      console.log(`  Batch ${batch + 1}/${totalBatches}: inserted=${inserted}, skipped=${skipped}, failed=${failed}`);
    }
  }

  // Write manifest
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}, Failed: ${failed}`);
  console.log(`Manifest written: ${manifestPath} (${manifest.length} users, ${manifest.length / 2} VU pairs)`);
}

function buildBatchSql(
  batch: {
    referenceId: string;
    email: string;
    name: string;
    code: string;
    walletRefId: string;
    statsRefId: string;
  }[],
): string {
  // Escape single quotes in values
  const esc = (s: string) => s.replace(/'/g, "''");

  const userValues = batch
    .map(
      (u) =>
        `('${esc(u.email)}', '${esc(u.name)}', '${esc(u.code)}', '${esc(u.referenceId)}', 'perf_db_${esc(u.referenceId)}', true, true, NOW(), NOW())`,
    )
    .join(',\n    ');

  const walletInserts = batch
    .map(
      (u) =>
        `INSERT INTO wallets ("referenceId", "userId", balance, "lockedAmount", "updatedAt") SELECT '${esc(u.walletRefId)}', id, ${WALLET_BALANCE}, 0, NOW() FROM users WHERE "referenceId" = '${esc(u.referenceId)}' ON CONFLICT ("userId") DO NOTHING;`,
    )
    .join('\n  ');

  const statsInserts = batch
    .map(
      (u) =>
        `INSERT INTO user_stats ("referenceId", "userId", "totalGamesPlayed", "gamesWon", "gamesLost", "gamesDrawn", "totalMoneyWon", "totalMoneyLost", "totalPlatformFeesPaid", "netProfit", "currentWinStreak", "longestWinStreak", "updatedAt") SELECT '${esc(u.statsRefId)}', id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NOW() FROM users WHERE "referenceId" = '${esc(u.referenceId)}' ON CONFLICT ("userId") DO NOTHING;`,
    )
    .join('\n  ');

  return `BEGIN;
  INSERT INTO users ("email", "name", "code", "referenceId", "googleId", "isActive", "onboarded", "createdAt", "updatedAt")
  VALUES
    ${userValues}
  ON CONFLICT (email) DO UPDATE SET "referenceId" = EXCLUDED."referenceId", "googleId" = EXCLUDED."googleId", "updatedAt" = NOW();
  ${walletInserts}
  ${statsInserts}
  COMMIT;`.replace(/\n/g, ' ');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
