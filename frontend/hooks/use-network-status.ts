"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Real (not simulated) online/offline detection via `navigator.onLine`
 * plus the `online`/`offline` window events. `navigator.onLine` alone can
 * false-positive (it only reflects network *interface* status, not
 * whether the backend is actually reachable) — this hook is deliberately
 * scoped to that same limitation rather than pretending to do full
 * connectivity probing, and documents the trade-off. See
 * docs/frontend/UX_SYSTEM.md "Network status detector".
 *
 * The server snapshot is always "online": Node 21+ defines a global
 * `navigator` without `onLine`, so reading it during SSR reported
 * "offline", rendered the offline banner into every page's HTML, and
 * caused a hydration mismatch on every route.
 */
export function useNetworkStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
