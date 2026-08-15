"use client";

import { useEffect, useState } from "react";

/**
 * Real (not simulated) online/offline detection via `navigator.onLine`
 * plus the `online`/`offline` window events. `navigator.onLine` alone can
 * false-positive (it only reflects network *interface* status, not
 * whether the backend is actually reachable) — this hook is deliberately
 * scoped to that same limitation rather than pretending to do full
 * connectivity probing, and documents the trade-off. See
 * docs/frontend/UX_SYSTEM.md "Network status detector".
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
