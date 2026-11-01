import { beforeEach, describe, expect, it } from "vitest";

import { updateFeatureFlag } from "@/api/admin/feature-flags";
import { MOCK_PRODUCTS } from "@/api/admin/mock-data";
import {
  listAllProducts,
  readModerationOverlaySync,
  setProductFlagged,
  setProductHidden,
} from "@/api/admin/products";

// Users, stores, and try-on jobs moved to the real /admin API in Phase 3.1 —
// see tests/unit/api/admin-api.test.ts. These cover the modules that are
// still mocked (no backend yet).

beforeEach(() => {
  window.localStorage.clear();
});

describe("admin mock data adapters", () => {
  it("listAllProducts resolves the fixed mock roster", async () => {
    const products = await listAllProducts();
    expect(products).toEqual(MOCK_PRODUCTS);
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

describe("feature flags", () => {
  it("updates only the targeted flag", async () => {
    const flags = await updateFeatureFlag("ai_stylist_enabled", { enabled: true });
    const target = flags.find((flag) => flag.key === "ai_stylist_enabled");
    const others = flags.filter((flag) => flag.key !== "ai_stylist_enabled");

    expect(target?.enabled).toBe(true);
    expect(others.every((flag) => flag.key !== "ai_stylist_enabled")).toBe(true);
  });
});
