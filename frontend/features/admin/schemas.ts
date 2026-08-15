import { z } from "zod";

export const FEATURE_FLAG_ENVIRONMENTS = ["all", "development", "staging", "production"] as const;

/** Validates the rollout-percentage/environment editor in features/admin/components/feature-flags/feature-flag-row.tsx. */
export const featureFlagUpdateSchema = z.object({
  environment: z.enum(FEATURE_FLAG_ENVIRONMENTS),
  rolloutPercentage: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z
      .number()
      .int("Whole numbers only")
      .min(0, "Rollout can't be negative")
      .max(100, "Rollout can't exceed 100%"),
  ),
});

export type FeatureFlagUpdateFormValues = z.infer<typeof featureFlagUpdateSchema>;
