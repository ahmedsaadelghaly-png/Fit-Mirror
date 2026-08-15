import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Phase 2.5 e2e coverage for the authenticated Platform Admin app. Same
 * approach as tests/e2e/shopper-smoke.spec.ts / brand-smoke.spec.ts: a
 * `fm_access_token` cookie holding an unsigned-but-well-formed JWT with a
 * `platform_admin` role claim. Unlike Shopper/Brand, almost none of this
 * data comes from the network — it's generated client-side in
 * api/admin/mock-data.ts (see docs/frontend/ADMIN_APP.md) — so the only
 * `page.route` stub needed is `GET /users/me`, the one real call every
 * page makes via `useAuth()`/`AdminGuard`.
 *
 * Run with:
 *   npx playwright install   (one-time, downloads browser binaries)
 *   npm run test:e2e
 */

const API_BASE_URL = "http://localhost:8000/api/v1";

function fakeAccessToken(role: "shopper" | "brand_admin" | "platform_admin"): string {
  const header = { alg: "none", typ: "JWT" };
  const payload = {
    sub: "33333333-3333-3333-3333-333333333333",
    type: "access",
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };
  const base64url = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${base64url(header)}.${base64url(payload)}.fake-signature`;
}

async function signInAsPlatformAdmin(page: Page) {
  await page.context().addCookies([
    {
      name: "fm_access_token",
      value: fakeAccessToken("platform_admin"),
      url: "http://localhost:3000",
    },
  ]);

  await page.route(`${API_BASE_URL}/users/me`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "33333333-3333-3333-3333-333333333333",
        email: "admin@fitmirror.ai",
        full_name: "Platform Admin",
        role: "platform_admin",
        is_active: true,
      }),
    }),
  );
}

test.describe("Admin dashboard", () => {
  test("renders the platform overview with mocked-data labels", async ({ page }) => {
    await signInAsPlatformAdmin(page);
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: /platform overview/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Stores" })).toBeVisible();
    await expect(page.getByText(/mocked data/i).first()).toBeVisible();
  });
});

test.describe("Users management", () => {
  test("lists mock users and supports filtering", async ({ page }) => {
    await signInAsPlatformAdmin(page);
    await page.goto("/admin/users");

    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    await expect(page.getByText("shopper@example.com")).toBeVisible();

    await page.getByLabel(/^role$/i).click();
    await page.getByRole("option", { name: "Brand admin" }).click();

    await expect(page.getByText("shopper@example.com")).not.toBeVisible();
    await expect(page.getByText("brand@fitmirror.ai")).toBeVisible();
  });
});

test.describe("Stores management", () => {
  test("lists mock stores with verification status", async ({ page }) => {
    await signInAsPlatformAdmin(page);
    await page.goto("/admin/stores");

    await expect(page.getByRole("heading", { name: "Stores" })).toBeVisible();
    await expect(page.getByText("Demo Fashion Co.")).toBeVisible();
    await expect(page.getByText("Velvet Studio")).toBeVisible();
  });
});

test.describe("Products monitoring", () => {
  test("lists mock products across stores", async ({ page }) => {
    await signInAsPlatformAdmin(page);
    await page.goto("/admin/products");

    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
    await expect(page.getByText("Classic Cotton T-Shirt")).toBeVisible();
    await expect(page.getByText("Oversized Hoodie")).toBeVisible();
  });
});

test.describe("Try-on jobs monitoring", () => {
  test("lists mock jobs and filters by status", async ({ page }) => {
    await signInAsPlatformAdmin(page);
    await page.goto("/admin/tryon-jobs");

    await expect(page.getByRole("heading", { name: "Try-on jobs" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Failed" })).toBeVisible();
    await page.getByRole("tab", { name: "Failed" }).click();
    await expect(page.getByRole("button", { name: /retry/i }).first()).toBeVisible();
  });
});

test.describe("Feature flags", () => {
  test("lists the six named flags and toggling one persists across reload", async ({ page }) => {
    await signInAsPlatformAdmin(page);
    await page.goto("/admin/feature-flags");

    await expect(page.getByRole("heading", { name: "Feature flags" })).toBeVisible();
    const aiStylistRow = page.getByRole("row", { name: /ai_stylist_enabled/i });
    await expect(aiStylistRow).toBeVisible();

    const checkbox = aiStylistRow.getByRole("checkbox");
    const wasChecked = await checkbox.isChecked();
    await checkbox.click();
    if (wasChecked) {
      await expect(checkbox).not.toBeChecked();
    } else {
      await expect(checkbox).toBeChecked();
    }

    await page.reload();
    const checkboxAfterReload = page
      .getByRole("row", { name: /ai_stylist_enabled/i })
      .getByRole("checkbox");
    if (wasChecked) {
      await expect(checkboxAfterReload).not.toBeChecked();
    } else {
      await expect(checkboxAfterReload).toBeChecked();
    }
  });
});

test.describe("Route protection for Admin routes", () => {
  for (const path of ["/admin/users", "/admin/stores", "/admin/products", "/admin/feature-flags"]) {
    test(`an unauthenticated visitor to ${path} is redirected to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/login\\?redirectTo=${encodeURIComponent(path)}`));
    });
  }
});
