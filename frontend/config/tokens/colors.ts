/**
 * Color design tokens.
 *
 * Runtime source of truth for the app is `app/globals.css` (CSS custom
 * properties, so light/dark mode is a single variable swap — see
 * docs/frontend/DESIGN_SYSTEM.md). This file has two jobs:
 *   1. Provide `cssVar` references for `tailwind.config.ts` to consume,
 *      so Tailwind's generated utility classes point at the same
 *      variables `globals.css` defines — one central place to change a
 *      token name.
 *   2. Provide the raw HSL triples for contexts that can't use CSS
 *      variables (e.g. a future Storybook "Design Tokens" doc page, or
 *      generating a color swatch programmatically).
 *
 * If you change a value here, you MUST also update the corresponding
 * `--variable` in `app/globals.css` — this file does not generate that
 * CSS (no build step wires them together yet; see
 * docs/frontend/DESIGN_SYSTEM.md "Planned: single-sourced tokens").
 */

/** Tailwind `theme.extend.colors` entries — `hsl(var(--x))` pattern. */
export const colorTokens = {
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  muted: {
    DEFAULT: "hsl(var(--muted))",
    foreground: "hsl(var(--muted-foreground))",
  },
  surface: {
    DEFAULT: "hsl(var(--surface))",
    foreground: "hsl(var(--surface-foreground))",
  },
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
    /** WCAG AA-safe for standalone text (links, etc.) — see app/globals.css. */
    text: "hsl(var(--primary-text))",
  },
  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))",
  },
  accent: {
    DEFAULT: "hsl(var(--accent))",
    foreground: "hsl(var(--accent-foreground))",
  },
  destructive: {
    DEFAULT: "hsl(var(--destructive))",
    foreground: "hsl(var(--destructive-foreground))",
  },
  success: {
    DEFAULT: "hsl(var(--success))",
    foreground: "hsl(var(--success-foreground))",
  },
  warning: {
    DEFAULT: "hsl(var(--warning))",
    foreground: "hsl(var(--warning-foreground))",
  },
  brass: {
    DEFAULT: "hsl(var(--brass))",
    foreground: "hsl(var(--brass-foreground))",
  },
  mirror: {
    DEFAULT: "hsl(var(--mirror))",
    soft: "hsl(var(--mirror-soft))",
  },
} as const;

/**
 * Raw HSL triples, mirroring `app/globals.css` exactly. "h s% l%" format
 * (no `hsl()` wrapper, no commas) — matches how they're written as CSS
 * custom property values.
 */
export const rawColorValues = {
  light: {
    background: "40 20% 97%",
    foreground: "240 8% 10%",
    surface: "0 0% 100%",
    muted: "40 14% 93%",
    mutedForeground: "240 4% 42%",
    border: "40 12% 87%",
    primary: "34 45% 48%",
    primaryForeground: "240 10% 9%",
    primaryText: "34 45% 38%",
    accent: "213 16% 93%",
    destructive: "6 45% 42%",
    success: "150 25% 32%",
    warning: "38 68% 45%",
    mirror: "213 12% 58%",
  },
  dark: {
    background: "240 6% 7%",
    foreground: "40 18% 95%",
    surface: "240 6% 11%",
    muted: "240 5% 15%",
    mutedForeground: "240 4% 64%",
    border: "240 6% 20%",
    primary: "36 55% 60%",
    primaryForeground: "240 10% 8%",
    primaryText: "36 55% 60%",
    accent: "213 14% 19%",
    destructive: "6 50% 58%",
    success: "150 30% 55%",
    warning: "38 70% 58%",
    mirror: "213 18% 70%",
  },
} as const;
