import { defineConfig, devices } from "@playwright/test";

/**
 * `PLAYWRIGHT_PROD_BUILD=true npm run test:e2e` runs every e2e spec
 * (including tests/e2e/accessibility.spec.ts) against a real production
 * build (`next build && next start`) instead of the dev server — a
 * "production smoke test" pass per docs/frontend/PERFORMANCE.md and
 * docs/DEPLOYMENT_FRONTEND.md's deployment checklist. Catches
 * dev-server-only false negatives (e.g. React Strict Mode's double-invoke
 * behavior, or a build-time-only failure) that `npm run dev` can't.
 */
const webServerCommand =
  process.env.PLAYWRIGHT_PROD_BUILD === "true" ? "npm run build && npm run start" : "npm run dev";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: webServerCommand,
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
