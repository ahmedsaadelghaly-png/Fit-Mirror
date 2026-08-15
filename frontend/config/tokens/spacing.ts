/**
 * Spacing design tokens — extends (never replaces) Tailwind's default 4px
 * base scale, imported directly by tailwind.config.ts. Only add a token
 * here when the default scale genuinely lacks a needed step; don't
 * duplicate values Tailwind already provides (e.g. no `sm`/`md` aliases).
 */
export const spacingTokens = {
  "4.5": "1.125rem",
  "18": "4.5rem",
  "22": "5.5rem",
  "30": "7.5rem",
} as const;

/** Container max-width/padding — see docs/frontend/DESIGN_SYSTEM.md "Spacing & layout". */
export const containerTokens = {
  center: true,
  padding: "1.5rem",
  screens: {
    "2xl": "1280px",
  },
} as const;
