import "@/app/globals.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Decorator, Preview } from "@storybook/react-vite";
import React from "react";

/**
 * Applies the same `.dark` class toggle app's ThemeProvider uses, so
 * every story can preview both light and dark mode via the toolbar theme
 * switch below. Space Grotesk/Inter/JetBrains Mono aren't loaded here (no
 * next/font in a plain Vite context), so component stories render with
 * each font's fallback in the family stack — see
 * docs/frontend/STORYBOOK.md for this trade-off.
 */
const withThemeClass: Decorator = (Story, context) => {
  const theme = context.globals.theme ?? "light";
  return React.createElement(
    "div",
    { className: theme === "dark" ? "dark" : undefined },
    React.createElement(
      "div",
      { className: "bg-background text-foreground min-h-24 p-6" },
      React.createElement(Story),
    ),
  );
};

/**
 * A handful of components (e.g. shared/components/resolved-image.tsx) call
 * a TanStack Query hook directly — without a provider in context, any such
 * story would crash with "No QueryClient set". One client for the whole
 * Storybook session (module scope, not per-story — a decorator function
 * isn't a component, so it can't call `useState` itself), retries
 * disabled so a story showing an error/loading state settles immediately
 * instead of retrying against Storybook's Vite dev server (which has no
 * `/api/v1` route to answer).
 */
const storybookQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const withQueryClient: Decorator = (Story) => {
  return React.createElement(
    QueryClientProvider,
    { client: storybookQueryClient },
    React.createElement(Story),
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      description: "Light/dark theme",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withThemeClass, withQueryClient],
};

export default preview;
