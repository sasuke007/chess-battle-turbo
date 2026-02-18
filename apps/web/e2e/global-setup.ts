import { clerkSetup } from "@clerk/testing/playwright";
import { FullConfig } from "@playwright/test";

export default async function globalSetup(_config: FullConfig) {
  const required = [
    "E2E_USER_A_EMAIL", "E2E_USER_A_PASSWORD",
    "E2E_USER_B_EMAIL", "E2E_USER_B_PASSWORD",
  ];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}. Create apps/web/.env.test with test credentials.`);
    }
  }
  await clerkSetup();
}
