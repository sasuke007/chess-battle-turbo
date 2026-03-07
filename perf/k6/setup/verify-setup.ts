/**
 * Verify perf test setup: count users, wallets, stats in DB and manifest.
 *
 * Usage: cd perf/k6 && npx tsx setup/verify-setup.ts
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const manifestPath = resolve(__dirname, 'user-manifest.json');
const envPath = resolve(__dirname, '../../.env');

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

function queryCount(table: string): number {
  try {
    const result = execSync(`psql "${dbUrl}" -c "SELECT count(*) FROM ${table}" -t 2>/dev/null`, {
      encoding: 'utf-8',
      timeout: 10000,
    });
    return parseInt(result.trim(), 10) || 0;
  } catch {
    return -1;
  }
}

function main() {
  console.log('=== Perf Setup Verification ===\n');

  // Check manifest
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    const withRef = manifest.filter((u: any) => u.referenceId).length;
    const withToken = manifest.filter((u: any) => u.token).length;

    console.log(`Manifest: ${manifest.length} users`);
    console.log(`  With referenceId: ${withRef}`);
    console.log(`  With token:       ${withToken}`);
    console.log(`  Max VU pairs:     ${Math.floor(manifest.length / 2)}`);
  } else {
    console.log('Manifest: NOT FOUND');
  }

  console.log('');

  // Check DB
  const tables = ['users', 'wallets', 'user_stats', 'legends', 'openings', 'chess_positions', 'games', 'tournaments'];
  console.log('Database counts:');
  for (const table of tables) {
    const count = queryCount(table);
    const status = count >= 0 ? count.toString() : 'ERROR';
    console.log(`  ${table}: ${status}`);
  }

  console.log('\n=== Verification Complete ===');
}

main();
