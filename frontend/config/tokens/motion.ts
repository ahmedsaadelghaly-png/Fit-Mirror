/**
 * Motion design tokens — imported directly by tailwind.config.ts. See
 * docs/frontend/DESIGN_SYSTEM.md "Motion" for the signature "mirror
 * sheen" effect (`sheen` keyframes below) and the global
 * prefers-reduced-motion handling (app/globals.css, not here — that rule
 * overrides every duration/animation globally regardless of these token
 * values).
 */
export const keyframeTokens = {
  "accordion-down": {
    from: { height: "0" },
    to: { height: "var(--radix-accordion-content-height)" },
  },
  "accordion-up": {
    from: { height: "var(--radix-accordion-content-height)" },
    to: { height: "0" },
  },
  "fade-in": {
    from: { opacity: "0", transform: "translateY(4px)" },
    to: { opacity: "1", transform: "translateY(0)" },
  },
  sheen: {
    "0%": { backgroundPosition: "-150% 0" },
    "100%": { backgroundPosition: "250% 0" },
  },
  shimmer: {
    "0%": { backgroundPosition: "-500px 0" },
    "100%": { backgroundPosition: "500px 0" },
  },
} as const;

export const animationTokens = {
  "accordion-down": "accordion-down 0.2s ease-out",
  "accordion-up": "accordion-up 0.2s ease-out",
  "fade-in": "fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
  sheen: "sheen 2.8s ease-in-out infinite",
  shimmer: "shimmer 1.8s linear infinite",
} as const;

/** Named easing curves — `transitionTimingFunction.signature` in Tailwind. */
export const easingTokens = {
  signature: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

/** Standard interactive-transition durations, for reference in components
 * that set duration via inline style/JS rather than a Tailwind class. */
export const durationTokens = {
  fast: "150ms",
  base: "200ms",
  slow: "500ms",
} as const;
