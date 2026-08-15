/**
 * Breakpoint design tokens — imported directly by tailwind.config.ts AND
 * usable from JS (e.g. a `useMediaQuery(BREAKPOINTS.md)` call) so the
 * numeric values never drift between CSS and JS. Kept at Tailwind's
 * standard values deliberately — see docs/frontend/DESIGN_SYSTEM.md
 * "Responsive breakpoints" for why non-standard breakpoints aren't worth
 * the inconsistency.
 */
export const breakpointTokens = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export type Breakpoint = keyof typeof breakpointTokens;

/** `(min-width: ...)` media query strings, ready for useMediaQuery(). */
export const breakpointQueries: Record<Breakpoint, string> = {
  sm: `(min-width: ${breakpointTokens.sm})`,
  md: `(min-width: ${breakpointTokens.md})`,
  lg: `(min-width: ${breakpointTokens.lg})`,
  xl: `(min-width: ${breakpointTokens.xl})`,
  "2xl": `(min-width: ${breakpointTokens["2xl"]})`,
};
