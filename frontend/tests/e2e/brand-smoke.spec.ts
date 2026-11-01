import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Phase 2.4 e2e coverage for the authenticated Brand/Store app. Same
 * approach as tests/e2e/shopper-smoke.spec.ts from Phase 2.3: a
 * `fm_access_token` cookie holding an unsigned-but-well-formed JWT with a
 * `brand_admin` role claim (see middleware/auth-guard.ts /
 * lib/jwt.ts docstring), plus `page.route` stubs matching the exact
 * response shapes in docs/API_CONTRACTS.md "Store Dashboard". There is
 * still no seeded backend account for a true login-driven e2e flow.
 *
 * Run with:
 *   npx playwright install   (one-time, downloads browser binaries)
 *   npm run test:e2e
 */

const API_BASE_URL = "http://localhost:8000/api/v1";

const DEMO_STORE = {
  id: "22222222-2222-2222-2222-222222222222",
  name: "Demo Fashion Co.",
  slug: "demo-fashion-co",
  logo_image_key: null,
  is_verified: true,
};

const DEMO_PRODUCT = {
  id: "33333333-3333-3333-3333-333333333333",
  title: "Classic Cotton T-Shirt",
  description: "A soft, everyday tee.",
  category: "tops",
  price: "24.99",
  currency: "USD",
  primary_image_key: null,
  is_active: true,
  variants: [
    {
      id: "v1",
      size_label: "M",
      color: "White",
      sku: "TSHIRT-WHT-M",
      stock_quantity: 50,
      garment_image_key: null,
    },
  ],
};

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

async function signInAsBrandAdmin(page: Page) {
  await page.context().addCookies([
    {
      name: "fm_access_token",
      value: fakeAccessToken("brand_admin"),
      url: "http://localhost:3000",
    },
  ]);

  await page.route(`${API_BASE_URL}/users/me`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "11111111-1111-1111-1111-111111111111",
        email: "brand@fitmirror.ai",
        full_name: "Demo Brand Admin",
        role: "brand_admin",
        is_active: true,
      }),
    }),
  );
}

async function mockExistingStore(page: Page) {
  await page.route(`${API_BASE_URL}/store/me`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(DEMO_STORE),
    }),
  );
}

async function mockMissingStore(page: Page) {
  await page.route(`${API_BASE_URL}/store/me`, (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        error_code: "not_found",
        message: "No store registered for this account.",
      }),
    }),
  );
}

async function mockStoreSummary(page: Page, overrides: Partial<typeof DEMO_STORE> = {}) {
  await page.route(`${API_BASE_URL}/store/me/summary`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        total_products: 0,
        total_tryon_jobs: 0,
        completed_tryon_jobs: 0,
        failed_tryon_jobs: 0,
        ...overrides,
      }),
    }),
  );
}

async function mockProducts(page: Page, products: unknown[]) {
  await page.route(`${API_BASE_URL}/store/products`, (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(products),
      });
    }
    return route.continue();
  });
}

test.describe("Brand dashboard", () => {
  test("renders the store summary and setup checklist for an existing store", async ({ page }) => {
    await signInAsBrandAdmin(page);
    await mockExistingStore(page);
    await mockStoreSummary(page);
    await mockProducts(page, []);

    await page.goto("/brand");

    await expect(page.getByRole("heading", { name: "Demo Fashion Co." })).toBeVisible();
    await expect(page.getByText(/verified/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /setup checklist/i })).toBeVisible();
    await expect(page.getByText(/no products yet/i)).toBeVisible();
  });

  test("prompts an existing brand admin with no store to set one up", async ({ page }) => {
    await signInAsBrandAdmin(page);
    await mockMissingStore(page);

    await page.goto("/brand");

    await expect(page.getByRole("heading", { name: /set up your store/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /set up your store/i })).toHaveAttribute(
      "href",
      "/brand/onboarding",
    );
  });
});

test.describe("Store onboarding", () => {
  test("creates a store from the basics step and advances to the logo step", async ({ page }) => {
    await signInAsBrandAdmin(page);
    await mockMissingStore(page);

    let storeCreated = false;
    await page.route(`${API_BASE_URL}/store`, (route) => {
      if (route.request().method() === "POST") {
        storeCreated = true;
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(DEMO_STORE),
        });
      }
      return route.continue();
    });

    await page.goto("/brand/onboarding");

    await expect(page.getByRole("heading", { name: /set up your store/i })).toBeVisible();
    await page.getByLabel(/store name/i).fill("Demo Fashion Co.");
    await page.getByRole("button", { name: /^continue$/i }).click();

    await expect(page.getByRole("heading", { name: /add your store logo/i })).toBeVisible();
    expect(storeCreated).toBe(true);
  });
});

test.describe("Products list", () => {
  test("shows the empty state with no products", async ({ page }) => {
    await signInAsBrandAdmin(page);
    await mockExistingStore(page);
    await mockProducts(page, []);

    await page.goto("/brand/products");

    await expect(page.getByRole("heading", { name: "Products", exact: true })).toBeVisible();
    await expect(page.getByText(/no products yet/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /add product/i }).first()).toBeVisible();
  });

  test("lists existing products in a table", async ({ page }) => {
    await signInAsBrandAdmin(page);
    await mockExistingStore(page);
    await mockProducts(page, [DEMO_PRODUCT]);

    await page.goto("/brand/products");

    await expect(page.getByText("Classic Cotton T-Shirt")).toBeVisible();
    await expect(page.getByText(/^tops$/i)).toBeVisible();
  });
});

test.describe("Create product", () => {
  test("submits the product form and calls POST /store/products", async ({ page }) => {
    await signInAsBrandAdmin(page);
    await mockExistingStore(page);

    let productCreated = false;
    await page.route(`${API_BASE_URL}/store/products`, (route) => {
      if (route.request().method() === "POST") {
        productCreated = true;
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(DEMO_PRODUCT),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([DEMO_PRODUCT]),
      });
    });

    await page.goto("/brand/products/new");

    await page.getByLabel(/^title$/i).fill("Classic Cotton T-Shirt");
    await page.getByRole("combobox", { name: /category/i }).click();
    await page.getByRole("option", { name: "Tops" }).click();
    await page.getByLabel(/^price$/i).fill("24.99");
    await page.getByRole("button", { name: /create product/i }).click();

    // Generous timeout: under `next dev`, the first visit to the detail route
    // compiles it on demand, which can exceed 5s on a loaded machine.
    await expect(page).toHaveURL(/\/brand\/products\/33333333-3333-3333-3333-333333333333$/, {
      timeout: 20_000,
    });
    expect(productCreated).toBe(true);
  });
});

test.describe("Product details", () => {
  test("shows product info and the variants section", async ({ page }) => {
    await signInAsBrandAdmin(page);
    await mockExistingStore(page);
    await mockProducts(page, [DEMO_PRODUCT]);

    await page.goto(`/brand/products/${DEMO_PRODUCT.id}`);

    await expect(page.getByRole("heading", { name: "Classic Cotton T-Shirt" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /variants/i })).toBeVisible();
    await expect(page.getByText("TSHIRT-WHT-M")).toBeVisible();
  });
});

test.describe("Route protection for new Brand routes", () => {
  for (const path of [
    "/brand/products",
    "/brand/inventory",
    "/brand/analytics",
    "/brand/settings",
  ]) {
    test(`an unauthenticated visitor to ${path} is redirected to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/login\\?redirectTo=${encodeURIComponent(path)}`));
    });
  }
});
