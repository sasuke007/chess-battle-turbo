/**
 * Sync Clerk users to the perf Neon DB.
 *
 * Creates User + Wallet + UserStats records for each user in the manifest.
 * Uses direct SQL (no Prisma dependency — runs standalone).
 *
 * Usage: cd perf/k6 && npx tsx setup/sync-users-to-db.ts
 *
 * Requires PERF_DATABASE_URL in perf/.env
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const manifestPath = resolve(__dirname, 'user-manifest.json');
const envPath = resolve(__dirname, '../../.env');

if (!existsSync(manifestPath)) {
  console.error('ERROR: user-manifest.json not found. Run create-clerk-users.ts first.');
  process.exit(1);
}

if (!existsSync(envPath)) {
  console.error('ERROR: perf/.env not found.');
  process.exit(1);
}

interface ManifestEntry {
  clerkId: string;
  email: string;
  referenceId: string;
  token: string;
}

// Parse env
const envContent = readFileSync(envPath, 'utf-8');
function getEnv(key: string): string {
  const line = envContent.split('\n').find((l) => l.startsWith(`${key}=`));
  return line?.split('=').slice(1).join('=').replace(/['"]/g, '') || '';
}

const dbUrl = getEnv('PERF_DATABASE_URL').replace('&channel_binding=require', '');

if (!dbUrl) {
  console.error('ERROR: PERF_DATABASE_URL not in perf/.env');
  process.exit(1);
}

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateCuid(): string {
  // Simple cuid-like ID for referenceId
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `cl${timestamp}${random}`;
}

async function main() {
  const manifest: ManifestEntry[] = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  console.log(`Syncing ${manifest.length} users to perf DB...`);

  // We'll use psql via child_process since we don't want a Prisma dependency
  const { execSync } = await import('child_process');

  let synced = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < manifest.length; i++) {
    const user = manifest[i]!;
    const name = user.email.split('@')[0]!.replace('perf-', 'PerfPlayer');
    const code = generateCode();
    const refId = user.referenceId || generateCuid();

    // Upsert User, Wallet, UserStats in a single transaction
    const sql = `
      BEGIN;

      INSERT INTO users ("googleId", email, name, code, "referenceId", "isActive", "onboarded", "createdAt", "updatedAt")
      VALUES ('${user.clerkId}', '${user.email}', '${name}', '${code}', '${refId}', true, true, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET "googleId" = EXCLUDED."googleId", "updatedAt" = NOW()
      RETURNING id, "referenceId";

      INSERT INTO wallets ("referenceId", "userId", balance, "lockedAmount", "updatedAt")
      SELECT '${generateCuid()}', u.id, 0, 0, NOW()
      FROM users u WHERE u.email = '${user.email}'
      ON CONFLICT ("userId") DO NOTHING;

      INSERT INTO user_stats ("referenceId", "userId", "totalGamesPlayed", "gamesWon", "gamesLost", "gamesDrawn",
        "totalMoneyWon", "totalMoneyLost", "totalPlatformFeesPaid", "netProfit",
        "currentWinStreak", "longestWinStreak", "updatedAt")
      SELECT '${generateCuid()}', u.id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NOW()
      FROM users u WHERE u.email = '${user.email}'
      ON CONFLICT ("userId") DO NOTHING;

      COMMIT;
    `.replace(/\n/g, ' ');

    try {
      const result = execSync(`psql "${dbUrl}" -c "${sql.replace(/"/g, '\\"')}" -t 2>&1`, {
        encoding: 'utf-8',
        timeout: 15000,
      });

      // Extract referenceId from the RETURNING clause
      const refMatch = result.match(/\|\s*(cl\w+)/);
      if (refMatch) {
        user.referenceId = refMatch[1]!;
      } else if (!user.referenceId) {
        // Query it
        const refResult = execSync(
          `psql "${dbUrl}" -c "SELECT \\"referenceId\\" FROM users WHERE email='${user.email}'" -t 2>&1`,
          { encoding: 'utf-8', timeout: 10000 },
        ).trim();
        if (refResult) user.referenceId = refResult;
      }

      synced++;
    } catch (err: any) {
      // Check if it's just a duplicate (already synced)
      if (err.stderr?.includes('duplicate') || err.stdout?.includes('duplicate')) {
        skipped++;
        // Still get the referenceId
        if (!user.referenceId) {
          try {
            const refResult = execSync(
              `psql "${dbUrl}" -c "SELECT \\"referenceId\\" FROM users WHERE email='${user.email}'" -t 2>&1`,
              { encoding: 'utf-8', timeout: 10000 },
            ).trim();
            if (refResult) user.referenceId = refResult;
          } catch {}
        }
      } else {
        console.error(`  [${i}] Failed: ${err.message?.substring(0, 100)}`);
        failed++;
      }
    }

    if ((i + 1) % 50 === 0 || i === manifest.length - 1) {
      console.log(`  Progress: ${i + 1}/${manifest.length} (synced: ${synced}, skipped: ${skipped}, failed: ${failed})`);
    }
  }

  // Save updated manifest with referenceIds
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\nDone! Synced: ${synced}, Skipped: ${skipped}, Failed: ${failed}`);
  console.log(`Manifest updated with referenceIds.`);

  // Validate
  const withRef = manifest.filter((u) => u.referenceId).length;
  console.log(`Users with referenceId: ${withRef}/${manifest.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
