import { expect, test } from "@playwright/test";

/**
 * Phase 2.2 e2e coverage: public marketing pages, auth page rendering,
 * and — now that middleware.ts enforces real route protection (see
 * middleware/auth-guard.ts) — that protected routes actually redirect an
 * unauthenticated visitor instead of rendering. There is still no
 * end-to-end "log in, then visit the dashboard" test, since that would
 * require a seeded backend account; see docs/frontend/AUTHENTICATION.md
 * for what a future authenticated e2e suite would need.
 *
 * Run with:
 *   npx playwright install   (one-time, downloads browser binaries)
 *   npm run test:e2e
 */

test.describe("Public marketing pages", () => {
  test("landing page renders the hero and primary CTAs", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("before it's yours");
    // The landing page repeats its primary CTA in a closing section
    // (hero + final call-to-action) — `.first()` disambiguates rather
    // than asserting there's only one, which is intentional.
    await expect(page.getByRole("link", { name: /create your account/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /i already have one/i }).first()).toBeVisible();
  });

  test("features page renders", async ({ page }) => {
    await page.goto("/features");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("shop with confidence");
  });

  test("pricing placeholder page renders", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("still working this out");
  });

  test("about page renders", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("contact page renders a working form", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/message/i)).toBeVisible();
  });

  test("privacy and terms placeholder pages render", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /privacy policy/i })).toBeVisible();

    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: /terms of service/i })).toBeVisible();
  });

  test("an unmatched route renders the custom 404 page", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByRole("link", { name: /back to home/i })).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("navigates from landing to login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Log in" }).first().click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

  test("navigates from landing to register", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /create your account/i }).first().click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
  });

  test("navigates from login to forgot-password", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /forgot password/i }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByRole("heading", { name: /reset your password/i })).toBeVisible();
  });
});

test.describe("Auth pages render their forms", () => {
  test("login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
  });

  test("register page", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("forgot-password page", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("session-expired page", async ({ page }) => {
    await page.goto("/session-expired");
    await expect(page.getByRole("heading", { name: /session has expired/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /log in again/i })).toBeVisible();
  });

  test("unauthorized page", async ({ page }) => {
    await page.goto("/unauthorized");
    await expect(page.getByRole("heading", { name: /don't have access/i })).toBeVisible();
  });
});

test.describe("Route protection (middleware)", () => {
  test("an unauthenticated visitor to /shopper is redirected to /login", async ({ page }) => {
    await page.goto("/shopper");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fshopper/);
  });

  test("an unauthenticated visitor to /brand is redirected to /login", async ({ page }) => {
    await page.goto("/brand");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fbrand/);
  });

  test("an unauthenticated visitor to /admin is redirected to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fadmin/);
  });

  test("public routes remain reachable with no session", async ({ page }) => {
    await page.goto("/features");
    await expect(page).toHaveURL(/\/features$/);
  });
});
