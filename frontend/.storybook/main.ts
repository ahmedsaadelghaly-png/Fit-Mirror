import tsconfigPaths from "vite-tsconfig-paths";
import type { StorybookConfig } from "@storybook/react-vite";

/**
 * Storybook runs on Vite (`@storybook/react-vite`), not Next.js's own
 * build pipeline — our components don't use next/image or next/font
 * directly (see docs/frontend/STORYBOOK.md for which components are and
 * aren't story-able as a result), so the lighter Vite-based framework is
 * enough and avoids pulling in a second, heavier Next-specific builder.
 *
 * `vite-tsconfig-paths` reads the SAME `@/*` aliases from tsconfig.json
 * that Next.js uses — one source of truth for path aliases, not a
 * second hand-maintained alias map that could drift from tsconfig.json.
 */
const config: StorybookConfig = {
  stories: ["../**/*.stories.@(ts|tsx)"],
  // No addon-essentials package: as of Storybook 9+, controls/actions/docs/
  // viewport/backgrounds are built into core and need no separate addon.
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (viteConfig) => {
    viteConfig.plugins ??= [];
    viteConfig.plugins.push(tsconfigPaths());
    return viteConfig;
  },
};

export default config;
