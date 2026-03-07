/**
 * Create 500 test users in Clerk for perf testing.
 *
 * Usage: cd perf/k6 && npx tsx setup/create-clerk-users.ts
 *
 * Requires CLERK_SECRET_KEY in perf/.env
 * Idempotent: skips users whose email already exists.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TOTAL_USERS = 500;
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000; // Clerk rate limit ~20 req/s
const EMAIL_PREFIX = 'perf-';
const EMAIL_DOMAIN = 'chessbattle.dev';
const PASSWORD = 'PerfTest123!Aa1';

// Load env
const envPath = resolve(__dirname, '../../.env');
if (!existsSync(envPath)) {
  console.error('ERROR: perf/.env not found');
  process.exit(1);
}

const envContent = readFileSync(envPath, 'utf-8');
const clerkKey = envContent
  .split('\n')
  .find((l) => l.startsWith('CLERK_SECRET_KEY='))
  ?.split('=')
  .slice(1)
  .join('=')
  .replace(/['"]/g, '');

if (!clerkKey) {
  console.error('ERROR: CLERK_SECRET_KEY not found in perf/.env');
  process.exit(1);
}

interface ClerkUser {
  id: string;
  email_addresses: Array<{ email_address: string }>;
  first_name: string;
}

interface ManifestEntry {
  clerkId: string;
  email: string;
  referenceId: string; // filled in by sync-users-to-db.ts
  token: string; // filled in by generate-clerk-tokens.ts
}

const manifestPath = resolve(__dirname, 'user-manifest.json');

async function createUser(index: number): Promise<ManifestEntry | null> {
  const email = `${EMAIL_PREFIX}${String(index).padStart(4, '0')}@${EMAIL_DOMAIN}`;
  const firstName = `PerfPlayer${index}`;

  const res = await fetch('https://api.clerk.com/v1/users', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${clerkKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: [email],
      password: PASSWORD,
      first_name: firstName,
      last_name: 'Perf',
      skip_password_checks: true,
    }),
  });

  if (res.status === 422) {
    // User likely exists — try to find them
    const existing = await findUserByEmail(email);
    if (existing) {
      return { clerkId: existing.id, email, referenceId: '', token: '' };
    }
    const errBody = await res.json();
    console.error(`  [${index}] 422: ${JSON.stringify(errBody.errors?.[0]?.message)}`);
    return null;
  }

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`  [${index}] ${res.status}: ${errBody}`);
    return null;
  }

  const user = (await res.json()) as ClerkUser;
  return { clerkId: user.id, email, referenceId: '', token: '' };
}

async function findUserByEmail(email: string): Promise<ClerkUser | null> {
  const res = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
    {
      headers: { Authorization: `Bearer ${clerkKey}` },
    },
  );

  if (!res.ok) return null;

  const users = (await res.json()) as ClerkUser[];
  return users.length > 0 ? users[0]! : null;
}

async function main() {
  console.log(`Creating ${TOTAL_USERS} Clerk users...`);
  console.log(`Email pattern: ${EMAIL_PREFIX}XXXX@${EMAIL_DOMAIN}`);

  // Load existing manifest if present
  let manifest: ManifestEntry[] = [];
  if (existsSync(manifestPath)) {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    console.log(`Existing manifest: ${manifest.length} users`);
  }

  const existingEmails = new Set(manifest.map((u) => u.email));
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (let batch = 0; batch < Math.ceil(TOTAL_USERS / BATCH_SIZE); batch++) {
    const promises: Promise<ManifestEntry | null>[] = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const index = batch * BATCH_SIZE + i;
      if (index >= TOTAL_USERS) break;

      const email = `${EMAIL_PREFIX}${String(index).padStart(4, '0')}@${EMAIL_DOMAIN}`;
      if (existingEmails.has(email)) {
        skipped++;
        continue;
      }

      promises.push(createUser(index));
    }

    const results = await Promise.all(promises);

    for (const result of results) {
      if (result) {
        manifest.push(result);
        created++;
      } else {
        failed++;
      }
    }

    // Progress
    const total = (batch + 1) * BATCH_SIZE;
    if (total % 50 === 0 || total >= TOTAL_USERS) {
      console.log(`  Progress: ${Math.min(total, TOTAL_USERS)}/${TOTAL_USERS} (created: ${created}, skipped: ${skipped}, failed: ${failed})`);
    }

    // Rate limit delay
    if (promises.length > 0) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  // Sort by email for deterministic ordering
  manifest.sort((a, b) => a.email.localeCompare(b.email));

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nDone! ${manifest.length} users in manifest.`);
  console.log(`Created: ${created}, Skipped: ${skipped}, Failed: ${failed}`);
  console.log(`Manifest: ${manifestPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
