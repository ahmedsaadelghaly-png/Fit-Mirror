import tailwindcssAnimate from "tailwindcss-animate";
import type { Config } from "tailwindcss";

import { breakpointTokens } from "./config/tokens/breakpoints";
import { colorTokens } from "./config/tokens/colors";
import { animationTokens, easingTokens, keyframeTokens } from "./config/tokens/motion";
import { radiusTokens } from "./config/tokens/radius";
import { boxShadowTokens } from "./config/tokens/shadows";
import { containerTokens, spacingTokens } from "./config/tokens/spacing";
import { fontFamilyTokens, fontSizeTokens } from "./config/tokens/typography";

/**
 * FitMirror AI design tokens.
 *
 * Every value below is imported from config/tokens/ — that's the single
 * source of truth (see each token file's docstring for whether it mirrors
 * app/globals.css CSS variables, like colors.ts, or is fully
 * self-contained, like typography.ts/motion.ts/breakpoints.ts). See
 * docs/frontend/DESIGN_SYSTEM.md for the full design rationale.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./shared/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./layouts/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}",
  ],
  theme: {
    container: containerTokens,
    screens: breakpointTokens,
    extend: {
      colors: colorTokens,
      borderRadius: radiusTokens,
      fontFamily: fontFamilyTokens,
      fontSize: fontSizeTokens,
      spacing: spacingTokens,
      boxShadow: boxShadowTokens,
      keyframes: keyframeTokens,
      animation: animationTokens,
      transitionTimingFunction: easingTokens,
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
