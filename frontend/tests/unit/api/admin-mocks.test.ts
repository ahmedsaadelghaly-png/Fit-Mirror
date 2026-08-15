import { beforeEach, describe, expect, it } from "vitest";

import { updateFeatureFlag } from "@/api/admin/feature-flags";
import { MOCK_PRODUCTS, MOCK_STORES, MOCK_TRYON_JOBS, MOCK_USERS } from "@/api/admin/mock-data";
import {
  listAllProducts,
  readModerationOverlaySync,
  setProductFlagged,
  setProductHidden,
} from "@/api/admin/products";
import {
  listStores,
  readStoreOverlaySync,
  setStoreSuspendedOverride,
  setStoreVerifiedOverride,
} from "@/api/admin/stores";
import { listAllTryOnJobs, readRetryOverlaySync, requestJobRetry } from "@/api/admin/tryon-jobs";
import {
  listUsers,
  readUserOverlaySync,
  setUserActiveOverride,
  setUserRoleOverride,
} from "@/api/admin/users";

beforeEach(() => {
  window.localStorage.clear();
});

describe("admin mock data adapters", () => {
  it("listUsers resolves the fixed mock roster", async () => {
    const users = await listUsers();
    expect(users).toEqual(MOCK_USERS);
  });

  it("listStores resolves the fixed mock roster", async () => {
    const stores = await listStores();
    expect(stores).toEqual(MOCK_STORES);
  });

  it("listAllProducts resolves the fixed mock roster", async () => {
    const products = await listAllProducts();
    expect(products).toEqual(MOCK_PRODUCTS);
  });

  it("listAllTryOnJobs resolves the fixed mock roster", async () => {
    const jobs = await listAllTryOnJobs();
    expect(jobs).toEqual(MOCK_TRYON_JOBS);
  });
});

describe("user overlay", () => {
  it("returns an empty overlay before any override is set", () => {
    expect(readUserOverlaySync("u-1")).toEqual({
      userId: "u-1",
      isActiveOverride: null,
      roleOverride: null,
    });
  });

  it("persists an active-status override across reads", async () => {
    await setUserActiveOverride("u-1", false);
    expect(readUserOverlaySync("u-1").isActiveOverride).toBe(false);
  });

  it("persists a role override without clobbering the active override", async () => {
    await setUserActiveOverride("u-1", false);
    await setUserRoleOverride("u-1", "brand_admin");
    const overlay = readUserOverlaySync("u-1");
    expect(overlay.isActiveOverride).toBe(false);
    expect(overlay.roleOverride).toBe("brand_admin");
  });
});

describe("store overlay", () => {
  it("persists verified and suspended overrides independently", async () => {
    await setStoreVerifiedOverride("s-1", true);
    await setStoreSuspendedOverride("s-1", true);
    const overlay = readStoreOverlaySync("s-1");
    expect(overlay.isVerifiedOverride).toBe(true);
    expect(overlay.isSuspendedOverride).toBe(true);
  });
});

describe("product moderation overlay", () => {
  it("persists flagged and hidden independently", async () => {
    await setProductFlagged("p-1", true);
    await setProductHidden("p-1", true);
    const overlay = readModerationOverlaySync("p-1");
    expect(overlay.isFlagged).toBe(true);
    expect(overlay.isHidden).toBe(true);
  });
});

describe("try-on job retry overlay", () => {
  it("records the retry request timestamp", async () => {
    expect(readRetryOverlaySync("j-1")).toBeNull();
    await requestJobRetry("j-1");
    expect(readRetryOverlaySync("j-1")).not.toBeNull();
  });
});

describe("feature flags", () => {
  it("updates only the targeted flag", async () => {
    const flags = await updateFeatureFlag("ai_stylist_enabled", { enabled: true });
    const target = flags.find((flag) => flag.key === "ai_stylist_enabled");
    const others = flags.filter((flag) => flag.key !== "ai_stylist_enabled");

    expect(target?.enabled).toBe(true);
    expect(others.every((flag) => flag.key !== "ai_stylist_enabled")).toBe(true);
  });
});
