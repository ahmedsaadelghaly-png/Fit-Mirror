"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Light/dark mode via next-themes: adds/removes the `.dark` class on
 * <html>, which is what every color token in app/globals.css switches on.
 * `defaultTheme="system"` respects the user's OS preference by default —
 * see docs/frontend/DESIGN_SYSTEM.md "Dark mode / light mode".
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
      {children}
    </NextThemesProvider>
  );
}
