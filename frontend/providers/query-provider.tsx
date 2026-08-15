"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

import { shouldRetryQuery, STALE_TIME } from "@/lib/performance/query-config";

/**
 * One QueryClient instance per browser session (created inside useState so
 * it survives re-renders but not page reloads — the standard Next.js App
 * Router pattern, avoiding a module-level singleton that would leak state
 * across requests during SSR). Cache-tuning policy lives in
 * lib/performance/query-config.ts — see docs/frontend/PERFORMANCE.md
 * "Cache tuning" for the reasoning and the tiers available to individual
 * hooks that want something other than the STANDARD default here.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_TIME.STANDARD,
            retry: shouldRetryQuery,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
