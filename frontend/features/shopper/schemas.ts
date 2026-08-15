import { z } from "zod";

/**
 * The backend's `BodyProfileUpsert` enforces no numeric bounds at all (see
 * backend app/schemas/user.py — plain `float | None`). These ranges are a
 * client-side sanity check only, chosen generously enough to never reject
 * a real human measurement while catching obvious typos (e.g. "1800cm").
 */
function optionalMeasurement(min: number, max: number, label: string) {
  return z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return Number.isNaN(num) ? val : num;
    },
    z
      .number()
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} must be at most ${max}`)
      .optional(),
  );
}

export const BODY_SHAPES = [
  "hourglass",
  "pear",
  "apple",
  "rectangle",
  "inverted_triangle",
] as const;

export const PREFERRED_FITS = ["slim", "regular", "relaxed", "oversized"] as const;

export const COLOR_PALETTE = [
  "black",
  "white",
  "navy",
  "beige",
  "olive",
  "burgundy",
  "pastel",
  "bold-print",
] as const;

export const STYLE_TAGS = [
  "minimalist",
  "streetwear",
  "classic",
  "bohemian",
  "athleisure",
  "formal",
] as const;

/** The backend-supported half of the body profile — see api/shopper/body-profile.ts. */
export const bodyMeasurementsSchema = z.object({
  height_cm: optionalMeasurement(50, 250, "Height"),
  weight_kg: optionalMeasurement(20, 300, "Weight"),
  chest_cm: optionalMeasurement(30, 200, "Chest"),
  waist_cm: optionalMeasurement(30, 200, "Waist"),
  hip_cm: optionalMeasurement(30, 200, "Hips"),
  body_shape: z.enum(BODY_SHAPES).optional().or(z.literal("")),
});

export type BodyMeasurementsFormValues = z.infer<typeof bodyMeasurementsSchema>;

/**
 * Frontend-only fields (see types/shopper.ts `StylePreferences` for the
 * documented backend contract mismatch) — persisted to localStorage, not
 * sent to `PUT /users/me/body-profile`.
 */
export const stylePreferencesSchema = z.object({
  preferred_fit: z.enum(PREFERRED_FITS).optional().or(z.literal("")),
  favorite_colors: z.array(z.enum(COLOR_PALETTE)).default([]),
  style_preferences: z.array(z.enum(STYLE_TAGS)).default([]),
});

export type StylePreferencesFormValues = z.infer<typeof stylePreferencesSchema>;

/** The combined Body Profile page form — one submit, two persistence targets. */
export const bodyProfileFormSchema = bodyMeasurementsSchema.merge(stylePreferencesSchema);

export type BodyProfileFormValues = z.infer<typeof bodyProfileFormSchema>;

export const WARDROBE_CATEGORIES = [
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "footwear",
  "accessories",
] as const;

export const wardrobeItemSchema = z.object({
  category: z.enum(WARDROBE_CATEGORIES, {
    errorMap: () => ({ message: "Choose a category" }),
  }),
  label: z.string().max(150, "Label is too long").optional().or(z.literal("")),
  source: z.enum(["uploaded", "catalog"]),
});

export type WardrobeItemFormValues = z.infer<typeof wardrobeItemSchema>;

export const shoppingAskSchema = z.object({
  query: z.string().min(1, "Type a question first").max(500, "Keep it under 500 characters"),
});

export type ShoppingAskFormValues = z.infer<typeof shoppingAskSchema>;

export const stylistRequestSchema = z.object({
  occasion: z.string().max(150).optional().or(z.literal("")),
  weather: z.string().max(150).optional().or(z.literal("")),
});

export type StylistRequestFormValues = z.infer<typeof stylistRequestSchema>;
