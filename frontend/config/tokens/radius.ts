/**
 * Radius design tokens — string values reference CSS variables defined in
 * app/globals.css (so radius could theoretically vary per-theme later,
 * though today light/dark share the same values). Imported directly by
 * tailwind.config.ts. See docs/frontend/DESIGN_SYSTEM.md "Radius" for why
 * these stay small-to-medium rather than the "everything is rounded-2xl"
 * default.
 */
export const radiusTokens = {
  sm: "var(--radius-sm)",
  DEFAULT: "var(--radius)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  full: "var(--radius-full)",
} as const;

/** Raw values, mirroring app/globals.css — see colors.ts for the same pattern. */
export const rawRadiusValues = {
  sm: "0.25rem",
  DEFAULT: "0.5rem",
  md: "0.625rem",
  lg: "0.875rem",
  xl: "1.25rem",
  full: "999px",
} as const;
