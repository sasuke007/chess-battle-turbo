import { test as base, type Page, type BrowserContext } from "@playwright/test";
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";

type AuthFixtures = {
  authedPage: Page;
  playerA: { context: BrowserContext; page: Page };
  playerB: { context: BrowserContext; page: Page };
};

async function signIn(page: Page, email: string, password: string) {
  await setupClerkTestingToken({ page });
  // Retry goto once — dev server may be compiling
  try {
    await page.goto("/", { timeout: 60_000, waitUntil: "domcontentloaded" });
  } catch {
    await page.waitForTimeout(2000);
    await page.goto("/", { timeout: 60_000, waitUntil: "domcontentloaded" });
  }
  await clerk.signIn({
    page,
    signInParams: { strategy: "password", identifier: email, password },
  });
}

export const test = base.extend<AuthFixtures>({
  authedPage: async ({ page }, use) => {
    const email = process.env.E2E_USER_A_EMAIL!;
    const password = process.env.E2E_USER_A_PASSWORD!;
    await signIn(page, email, password);
    await use(page);
  },

  playerA: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const email = process.env.E2E_USER_A_EMAIL!;
    const password = process.env.E2E_USER_A_PASSWORD!;
    await signIn(page, email, password);
    await use({ context, page });
    await context.close();
  },

  playerB: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const email = process.env.E2E_USER_B_EMAIL!;
    const password = process.env.E2E_USER_B_PASSWORD!;
    await signIn(page, email, password);
    await use({ context, page });
    await context.close();
  },
});

export { expect } from "@playwright/test";
