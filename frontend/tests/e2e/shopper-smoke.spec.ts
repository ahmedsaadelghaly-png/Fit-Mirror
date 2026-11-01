import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Phase 2.3 e2e coverage for the authenticated Shopper app.
 *
 * There is still no seeded backend account for a true end-to-end login
 * (see docs/frontend/AUTHENTICATION.md — this remains a known gap). These
 * tests instead fake an authenticated session the same way
 * middleware/auth-guard.ts actually validates one — a `fm_access_token`
 * cookie holding an unsigned-but-well-formed JWT with a `role` claim (see
 * lib/jwt.ts's docstring on why decoding without verifying is safe for
 * this exact purpose) — and stub the backend endpoints each page calls via
 * `page.route`, matching the exact response shapes documented in
 * docs/API_CONTRACTS.md. This exercises real components, real TanStack
 * Query hooks, and the real middleware redirect logic; only the network
 * layer is stubbed.
 *
 * Run with:
 *   npx playwright install   (one-time, downloads browser binaries)
 *   npm run test:e2e
 */

const API_BASE_URL = "http://localhost:8000/api/v1";

function fakeAccessToken(role: "shopper" | "brand_admin" | "platform_admin"): string {
  const header = { alg: "none", typ: "JWT" };
  const payload = {
    sub: "11111111-1111-1111-1111-111111111111",
    type: "access",
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };
  const base64url = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${base64url(header)}.${base64url(payload)}.fake-signature`;
}

async function signInAsShopper(page: Page) {
  await page.context().addCookies([
    {
      name: "fm_access_token",
      value: fakeAccessToken("shopper"),
      url: "http://localhost:3000",
    },
  ]);

  await page.route(`${API_BASE_URL}/users/me`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "11111111-1111-1111-1111-111111111111",
        email: "shopper@example.com",
        full_name: "Ada Shopper",
        role: "shopper",
        is_active: true,
      }),
    }),
  );
}

async function mockEmptyWardrobe(page: Page) {
  await page.route(`${API_BASE_URL}/wardrobe`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
}

async function mockEmptyTryOnJobs(page: Page) {
  await page.route(`${API_BASE_URL}/tryon`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
}

async function mockEmptySavedLooks(page: Page) {
  await page.route(`${API_BASE_URL}/saved-looks`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
}

async function mockNoBodyProfiles(page: Page) {
  await page.route(`${API_BASE_URL}/users/me/body-profiles`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
  );
}

const CATALOG_PRODUCT = {
  id: "44444444-4444-4444-4444-444444444444",
  title: "Leather Biker Jacket",
  description: "Classic biker cut in soft black leather.",
  category: "outerwear",
  audience: "women",
  price: "189.00",
  currency: "USD",
  primary_image_key: null,
  is_active: true,
  is_archived: false,
  variants: [
    {
      id: "v-s",
      size_label: "S",
      color: "Black",
      sku: "LBJ-S",
      stock_quantity: 2,
      garment_image_key: null,
    },
    {
      id: "v-m",
      size_label: "M",
      color: "Black",
      sku: "LBJ-M",
      stock_quantity: 2,
      garment_image_key: null,
    },
  ],
};

async function mockCatalog(page: Page) {
  await page.route(`${API_BASE_URL}/catalog/products**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([CATALOG_PRODUCT]),
    }),
  );
}

async function mockMissingBodyProfile(page: Page) {
  await page.route(`${API_BASE_URL}/users/me/body-profile`, (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error_code: "not_found", message: "Body profile not set up yet." }),
    }),
  );
}

test.describe("Shopper dashboard", () => {
  test("renders the welcome summary and empty-state summary cards", async ({ page }) => {
    await signInAsShopper(page);
    await mockEmptyWardrobe(page);
    await mockEmptyTryOnJobs(page);
    await mockEmptySavedLooks(page);

    await page.goto("/shopper");

    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByText(/no try-ons yet/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Wardrobe" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Saved looks" })).toBeVisible();
  });
});

test.describe("Body profile page", () => {
  test("shows the empty-profile prompt and a full measurements form", async ({ page }) => {
    await signInAsShopper(page);
    await mockMissingBodyProfile(page);
    await mockNoBodyProfiles(page);

    await page.goto("/shopper/profile");

    await expect(page.getByRole("heading", { name: /body profile/i })).toBeVisible();
    await expect(page.getByText(/haven't set up a body profile/i)).toBeVisible();
    await expect(page.getByLabel(/height \(cm\)/i)).toBeVisible();
    await expect(page.getByLabel(/weight \(kg\)/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /save body profile/i })).toBeVisible();
  });
});

test.describe("Virtual try-on page", () => {
  test("renders the split workspace with a disabled create action until both photos are added", async ({
    page,
  }) => {
    await signInAsShopper(page);
    await mockEmptyTryOnJobs(page);
    await mockEmptySavedLooks(page);

    await page.goto("/shopper/tryon");

    await expect(page.getByRole("heading", { name: /virtual try-on/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your photo" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Garment" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Result" })).toBeVisible();
    await expect(page.getByRole("button", { name: /create try-on/i })).toBeDisabled();
  });
});

test.describe("Shop page", () => {
  test("lists catalog products and opens the try-on dialog", async ({ page }) => {
    await signInAsShopper(page);
    await mockCatalog(page);
    await mockNoBodyProfiles(page);

    await page.goto("/shopper/shop");

    await expect(page.getByRole("heading", { name: "Shop", exact: true })).toBeVisible();
    await expect(page.getByText("Leather Biker Jacket")).toBeVisible();

    await page.getByRole("button", { name: "Try on", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Leather Biker Jacket" })).toBeVisible();
    await expect(dialog.getByRole("radio", { name: /^M/ })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /try it on/i })).toBeDisabled();
  });
});

test.describe("Wardrobe page", () => {
  test("shows the empty state and an add-item entry point when there are no items", async ({
    page,
  }) => {
    await signInAsShopper(page);
    await mockEmptyWardrobe(page);

    await page.goto("/shopper/wardrobe");

    await expect(page.getByRole("heading", { name: "Wardrobe" })).toBeVisible();
    await expect(page.getByText(/your wardrobe is empty/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /add item/i })).toBeVisible();
  });
});

test.describe("Route protection for new Shopper routes", () => {
  for (const path of [
    "/shopper/wardrobe",
    "/shopper/shop",
    "/shopper/tryon",
    "/shopper/profile",
    "/shopper/settings",
  ]) {
    test(`an unauthenticated visitor to ${path} is redirected to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/login\\?redirectTo=${encodeURIComponent(path)}`));
    });
  }
});
