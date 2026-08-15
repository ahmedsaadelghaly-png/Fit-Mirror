/**
 * Typography design tokens — imported directly by tailwind.config.ts, so
 * this is the single source of truth for font families and the type
 * scale (unlike colors.ts, which mirrors CSS variables defined elsewhere).
 * See docs/frontend/DESIGN_SYSTEM.md "Typography" for the rationale
 * behind each typeface choice.
 */

export const fontFamilyTokens: Record<string, string[]> = {
  display: ["var(--font-display)", "sans-serif"],
  body: ["var(--font-body)", "sans-serif"],
  mono: ["var(--font-mono)", "monospace"],
};

/** [fontSize, { lineHeight, letterSpacing? }] tuples, Tailwind's fontSize format. */
export const fontSizeTokens: Record<
  string,
  [string, { lineHeight: string; letterSpacing?: string }]
> = {
  xs: ["0.75rem", { lineHeight: "1.1rem" }],
  sm: ["0.875rem", { lineHeight: "1.35rem" }],
  base: ["1rem", { lineHeight: "1.6rem" }],
  lg: ["1.125rem", { lineHeight: "1.7rem" }],
  xl: ["1.375rem", { lineHeight: "1.85rem", letterSpacing: "-0.01em" }],
  "2xl": ["1.75rem", { lineHeight: "2.15rem", letterSpacing: "-0.015em" }],
  "3xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.02em" }],
  "4xl": ["2.75rem", { lineHeight: "2.9rem", letterSpacing: "-0.025em" }],
  "5xl": ["3.5rem", { lineHeight: "3.6rem", letterSpacing: "-0.03em" }],
  "6xl": ["4.5rem", { lineHeight: "4.5rem", letterSpacing: "-0.035em" }],
};
