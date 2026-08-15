"use client";

import { useEffect } from "react";

import { Toaster } from "@/components/ui/toaster";
import { CommandPalette } from "@/features/command-palette/command-palette";
import { useWebVitals } from "@/hooks/use-web-vitals";
import { validateProductionEnv } from "@/lib/security/validate-production-env";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ConfirmDialogProvider } from "@/shared/components/confirm-dialog-provider";
import { OfflineBanner } from "@/shared/components/offline-banner";

/**
 * Mounted once, here: reports Core Web Vitals (hooks/use-web-vitals.ts,
 * docs/frontend/PERFORMANCE.md) and runs production env safety checks
 * (lib/security/validate-production-env.ts, docs/frontend/SECURITY_FRONTEND.md)
 * on first client-side render.
 */
function StartupEffects() {
  useWebVitals();
  useEffect(() => {
    validateProductionEnv();
  }, []);
  return null;
}

/**
 * Single composition root for every app-wide provider. Order matters only
 * in that ThemeProvider should wrap everything (it just toggles a class on
 * <html>, cheap and side-effect-free to be outermost).
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <ConfirmDialogProvider>
            <StartupEffects />
            <OfflineBanner />
            {children}
            <Toaster />
            <CommandPalette />
          </ConfirmDialogProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
