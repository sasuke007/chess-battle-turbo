/**
 * One-time provisioning script for E2E test users E through P.
 *
 * Creates 12 Clerk users via the REST API and prints the .env.test entries.
 *
 * Usage:
 *   cd apps/web
 *   set -a && source .env.test && set +a
 *   npx tsx e2e/scripts/provision-test-users.ts
 */

import crypto from "node:crypto";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
if (!CLERK_SECRET_KEY) {
  console.error("CLERK_SECRET_KEY must be set. Source .env.test first.");
  process.exit(1);
}

const LETTERS = "EFGHIJKLMNOP".split("");

function generatePassword(): string {
  return crypto.randomBytes(12).toString("base64url") + "!Aa1";
}

async function createClerkUser(
  letter: string,
  password: string,
): Promise<{ id: string; email: string }> {
  const email = `e2e-player${letter.toLowerCase()}@chessbattle.dev`;
  const res = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: [email],
      password,
      first_name: `TestPlayer${letter}`,
      last_name: "E2E",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    // If user already exists, that's fine — just warn
    if (res.status === 422 && text.includes("already been taken")) {
      console.warn(`  User ${email} already exists — skipping creation`);
      return { id: "existing", email };
    }
    throw new Error(`Failed to create ${email}: ${res.status} ${text}`);
  }

  const data = await res.json();
  return { id: data.id as string, email };
}

async function main() {
  console.log("Provisioning 12 E2E test users (E through P)...\n");

  const envLines: string[] = [];

  for (const letter of LETTERS) {
    const password = generatePassword();
    const { email } = await createClerkUser(letter, password);
    console.log(`  Created: ${email}`);

    envLines.push(`E2E_USER_${letter}_EMAIL=${email}`);
    envLines.push(`E2E_USER_${letter}_PASSWORD=${password}`);
  }

  console.log("\n# Append these lines to apps/web/.env.test:\n");
  console.log(envLines.join("\n"));
  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
