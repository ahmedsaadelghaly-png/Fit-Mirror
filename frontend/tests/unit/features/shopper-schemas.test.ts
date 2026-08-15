import { describe, expect, it } from "vitest";

import { bodyMeasurementsSchema, wardrobeItemSchema } from "@/features/shopper/schemas";

describe("bodyMeasurementsSchema", () => {
  it("accepts a fully empty payload — every field is optional, matching the backend's BodyProfileUpsert", () => {
    const result = bodyMeasurementsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts realistic measurements", () => {
    const result = bodyMeasurementsSchema.safeParse({
      height_cm: 172,
      weight_kg: 65,
      chest_cm: 92,
      waist_cm: 76,
      hip_cm: 98,
      body_shape: "hourglass",
    });
    expect(result.success).toBe(true);
  });

  it('treats an empty string as "not provided" rather than 0', () => {
    const result = bodyMeasurementsSchema.safeParse({ height_cm: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.height_cm).toBeUndefined();
    }
  });

  it("rejects a height below the sane minimum", () => {
    const result = bodyMeasurementsSchema.safeParse({ height_cm: 10 });
    expect(result.success).toBe(false);
  });

  it("rejects a weight above the sane maximum", () => {
    const result = bodyMeasurementsSchema.safeParse({ weight_kg: 1000 });
    expect(result.success).toBe(false);
  });

  it("rejects a body_shape outside the known set", () => {
    const result = bodyMeasurementsSchema.safeParse({ body_shape: "triangle-of-power" });
    expect(result.success).toBe(false);
  });

  it("coerces a numeric string from a number input into a number", () => {
    const result = bodyMeasurementsSchema.safeParse({ waist_cm: "80" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.waist_cm).toBe(80);
    }
  });
});

describe("wardrobeItemSchema", () => {
  it("accepts a valid uploaded item", () => {
    const result = wardrobeItemSchema.safeParse({
      category: "tops",
      label: "Blue denim jacket",
      source: "uploaded",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an item with no label — label is optional", () => {
    const result = wardrobeItemSchema.safeParse({ category: "footwear", source: "uploaded" });
    expect(result.success).toBe(true);
  });

  it("rejects a category outside the known set", () => {
    const result = wardrobeItemSchema.safeParse({ category: "hats", source: "uploaded" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing category", () => {
    const result = wardrobeItemSchema.safeParse({ source: "uploaded" });
    expect(result.success).toBe(false);
  });

  it("rejects a label over the max length", () => {
    const result = wardrobeItemSchema.safeParse({
      category: "tops",
      label: "a".repeat(151),
      source: "uploaded",
    });
    expect(result.success).toBe(false);
  });
});
