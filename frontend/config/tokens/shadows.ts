/**
 * Shadow design tokens — imported directly by tailwind.config.ts. Shadows
 * are low-opacity and layered, keyed to a `--shadow-color` CSS variable so
 * dark mode shadows resolve to true black instead of a washed-out gray.
 * See docs/frontend/DESIGN_SYSTEM.md "Shadows".
 */
export const boxShadowTokens = {
  xs: "0 1px 2px 0 hsl(var(--shadow-color) / 0.04)",
  sm: "0 1px 3px 0 hsl(var(--shadow-color) / 0.06), 0 1px 2px -1px hsl(var(--shadow-color) / 0.06)",
  DEFAULT:
    "0 2px 8px -2px hsl(var(--shadow-color) / 0.08), 0 1px 3px -1px hsl(var(--shadow-color) / 0.06)",
  md: "0 8px 24px -4px hsl(var(--shadow-color) / 0.10), 0 2px 6px -2px hsl(var(--shadow-color) / 0.06)",
  lg: "0 16px 40px -8px hsl(var(--shadow-color) / 0.14), 0 4px 12px -4px hsl(var(--shadow-color) / 0.08)",
  // The signature "mirror" glow — used only behind the reflective
  // auth-panel/sheen effect, never as a general elevation utility.
  mirror: "0 0 0 1px hsl(var(--mirror) / 0.16), 0 12px 32px -8px hsl(var(--mirror) / 0.24)",
} as const;
