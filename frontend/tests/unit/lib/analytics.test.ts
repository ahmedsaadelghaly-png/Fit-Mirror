import { describe, expect, it, vi } from "vitest";

import { getAnalyticsAdapter, setAnalyticsAdapter } from "@/lib/analytics/adapter";
import {
  adminActionEvents,
  brandProductFunnel,
  identifyUser,
  resetAnalyticsIdentity,
  trackEvent,
  trackPageView,
  tryOnFunnel,
} from "@/lib/analytics/events";
import type { AnalyticsAdapter } from "@/lib/analytics/types";

function createSpyAdapter(): AnalyticsAdapter & {
  pageView: ReturnType<typeof vi.fn>;
  track: ReturnType<typeof vi.fn>;
  identify: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
} {
  return {
    name: "spy",
    pageView: vi.fn(),
    track: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  };
}

describe("getAnalyticsAdapter", () => {
  it("defaults to the console adapter in the test/development environment", () => {
    expect(getAnalyticsAdapter().name).toBe("console");
  });
});

describe("setAnalyticsAdapter", () => {
  it("overrides the active adapter for every subsequent call", () => {
    const spy = createSpyAdapter();
    setAnalyticsAdapter(spy);

    trackPageView("/wardrobe", { source: "nav" });
    trackEvent("custom_event", { foo: "bar" });
    identifyUser("user-1", { plan: "free" });
    resetAnalyticsIdentity();

    expect(spy.pageView).toHaveBeenCalledWith("/wardrobe", { source: "nav" });
    expect(spy.track).toHaveBeenCalledWith("custom_event", { foo: "bar" });
    expect(spy.identify).toHaveBeenCalledWith("user-1", { plan: "free" });
    expect(spy.reset).toHaveBeenCalledTimes(1);
  });
});

describe("tryOnFunnel", () => {
  it("jobCreated tracks the event name with the job id merged into properties", () => {
    const spy = createSpyAdapter();
    setAnalyticsAdapter(spy);

    tryOnFunnel.jobCreated("job-1", { store: "demo" });

    expect(spy.track).toHaveBeenCalledWith("tryon_job_created", { job_id: "job-1", store: "demo" });
  });

  it("started/photosUploaded/lookSaved track with no required properties", () => {
    const spy = createSpyAdapter();
    setAnalyticsAdapter(spy);

    tryOnFunnel.started();
    tryOnFunnel.photosUploaded();
    tryOnFunnel.lookSaved();

    expect(spy.track).toHaveBeenNthCalledWith(1, "tryon_started", undefined);
    expect(spy.track).toHaveBeenNthCalledWith(2, "tryon_photos_uploaded", undefined);
    expect(spy.track).toHaveBeenNthCalledWith(3, "tryon_look_saved", undefined);
  });
});

describe("brandProductFunnel", () => {
  it("productCreated tracks with the product id merged in", () => {
    const spy = createSpyAdapter();
    setAnalyticsAdapter(spy);

    brandProductFunnel.productCreated("p-1");

    expect(spy.track).toHaveBeenCalledWith("brand_product_created", { product_id: "p-1" });
  });
});

describe("adminActionEvents", () => {
  it("featureFlagToggled tracks the flag key and enabled state", () => {
    const spy = createSpyAdapter();
    setAnalyticsAdapter(spy);

    adminActionEvents.featureFlagToggled("ai_stylist_enabled", true);

    expect(spy.track).toHaveBeenCalledWith("admin_feature_flag_toggled", {
      flag_key: "ai_stylist_enabled",
      enabled: true,
    });
  });
});
