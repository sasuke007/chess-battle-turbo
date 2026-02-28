import crypto from "node:crypto";
import type { Page, Browser } from "@playwright/test";
import { signIn } from "./auth";

/**
 * Create a tournament via the authenticated API from a signed-in page context.
 * Returns the `tournamentReferenceId`.
 */
export async function createTournamentViaApi(
  page: Page,
  name: string,
): Promise<string> {
  const result = await page.evaluate(async (tournamentName: string) => {
    const res = await fetch("/api/tournament/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: tournamentName,
        mode: "FREE",
        durationMinutes: 30,
        initialTimeSeconds: 300,
        incrementSeconds: 5,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create tournament: ${res.status} ${text}`);
    }
    const data = await res.json();
    return data.data.referenceId as string;
  }, name);

  return result;
}

/**
 * Ensure the user is synced to the local DB and onboarding is skipped.
 * Calls the sync + onboarding-skip APIs directly — far more reliable
 * than waiting for the UI onboarding flow for temp users.
 */
async function ensureUserSyncedAndOnboarded(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // Sync user to local DB (creates the user if it doesn't exist)
    const syncRes = await fetch("/api/user/sync", { method: "POST" });
    if (!syncRes.ok) {
      throw new Error(`User sync failed: ${syncRes.status}`);
    }
    const syncData = await syncRes.json();

    // Skip onboarding if not already done
    if (syncData.user && !syncData.user.onboarded) {
      const skipRes = await fetch("/api/user/onboarding-skip", { method: "POST" });
      if (!skipRes.ok) {
        throw new Error(`Onboarding skip failed: ${skipRes.status}`);
      }
    }
  });
}

/**
 * Create temporary Clerk users via the REST API, sign each one in via a
 * temporary browser context, join the tournament, then close the context.
 *
 * Returns an array of Clerk user IDs for cleanup.
 */
export async function createTempUsersAndJoin(
  browser: Browser,
  tournamentRefId: string,
  count: number,
): Promise<string[]> {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    throw new Error("CLERK_SECRET_KEY is required in .env.test for creating temp users");
  }

  const clerkUserIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const timestamp = Date.now();
    const email = `e2e-temp-${timestamp}-${i}@chessbattle.dev`;
    // Suffix ensures Clerk password complexity (uppercase, lowercase, digit, special)
    const complexitySuffix = String.fromCharCode(33, 65, 97, 49); // !Aa1
    const password = crypto.randomBytes(12).toString("base64url") + complexitySuffix;

    // Create user via Clerk REST API
    const createRes = await fetch("https://api.clerk.com/v1/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: [email],
        password,
        first_name: `TempPlayer${i + 1}`,
        last_name: "E2E",
      }),
    });

    if (!createRes.ok) {
      const text = await createRes.text();
      throw new Error(`Failed to create Clerk user: ${createRes.status} ${text}`);
    }

    const userData = await createRes.json();
    const clerkUserId = userData.id as string;
    clerkUserIds.push(clerkUserId);

    // Sign in via a temp browser context, join tournament, close
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await signIn(page, email, password);

      // Ensure the user is synced to local DB and onboarding is completed
      // before navigating away. This avoids the onboarding redirect race.
      await ensureUserSyncedAndOnboarded(page);

      await page.goto(`/tournament/${tournamentRefId}`, {
        timeout: 60_000,
        waitUntil: "domcontentloaded",
      });

      // Wait for the join button to appear, then click
      const joinBtn = page.locator('[data-testid="join-tournament-button"]');
      await joinBtn.waitFor({ timeout: 30_000 });
      await joinBtn.click();
      // Wait for join to complete (button disappears)
      await joinBtn.waitFor({ state: "hidden", timeout: 30_000 });
    } finally {
      await context.close();
    }
  }

  return clerkUserIds;
}

/**
 * Delete temporary Clerk users created during the test.
 */
export async function cleanupTempUsers(clerkUserIds: string[]): Promise<void> {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) return;

  for (const userId of clerkUserIds) {
    try {
      await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
        },
      });
    } catch {
      // Best-effort cleanup — don't fail the test
    }
  }
}
