/**
 * Generate Clerk session JWTs for tournament API routes.
 *
 * Uses Clerk's sign-in tokens API to create session tokens
 * that can be used as Bearer tokens for authenticated routes.
 *
 * Usage: cd perf/k6 && npx tsx setup/generate-clerk-tokens.ts
 *
 * Requires CLERK_SECRET_KEY in perf/.env
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

const envContent = readFileSync(envPath, 'utf-8');
function getEnv(key: string): string {
  const line = envContent.split('\n').find((l) => l.startsWith(`${key}=`));
  return line?.split('=').slice(1).join('=').replace(/['"]/g, '') || '';
}

const clerkKey = getEnv('CLERK_SECRET_KEY');
if (!clerkKey) {
  console.error('ERROR: CLERK_SECRET_KEY not in perf/.env');
  process.exit(1);
}

interface ManifestEntry {
  clerkId: string;
  email: string;
  referenceId: string;
  token: string;
}

async function generateToken(clerkId: string): Promise<string | null> {
  // Create a sign-in token
  const res = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clerkKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: clerkId,
      expires_in_seconds: 86400 * 7, // 7 days
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  Token creation failed for ${clerkId}: ${res.status} ${err.substring(0, 100)}`);
    return null;
  }

  const data = await res.json();
  return data.token as string;
}

async function main() {
  const manifest: ManifestEntry[] = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  console.log(`Generating Clerk tokens for ${manifest.length} users...`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  const BATCH_SIZE = 10;
  const BATCH_DELAY_MS = 1000;

  for (let batch = 0; batch < Math.ceil(manifest.length / BATCH_SIZE); batch++) {
    const promises: Promise<void>[] = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const index = batch * BATCH_SIZE + i;
      if (index >= manifest.length) break;

      const user = manifest[index]!;

      // Skip if already has a token
      if (user.token) {
        skipped++;
        continue;
      }

      promises.push(
        generateToken(user.clerkId).then((token) => {
          if (token) {
            user.token = token;
            generated++;
          } else {
            failed++;
          }
        }),
      );
    }

    await Promise.all(promises);

    const total = (batch + 1) * BATCH_SIZE;
    if (total % 50 === 0 || total >= manifest.length) {
      console.log(`  Progress: ${Math.min(total, manifest.length)}/${manifest.length} (generated: ${generated}, skipped: ${skipped}, failed: ${failed})`);
    }

    if (promises.length > 0) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const withTokens = manifest.filter((u) => u.token).length;
  console.log(`\nDone! Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}`);
  console.log(`Users with tokens: ${withTokens}/${manifest.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
