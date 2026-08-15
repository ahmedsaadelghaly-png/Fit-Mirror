"use client";

import { WifiOff } from "lucide-react";

import { useNetworkStatus } from "@/hooks/use-network-status";

/** Real, visible banner — not a placeholder — driven by hooks/use-network-status.ts. Mounted once in providers/app-providers.tsx. */
function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground"
    >
      <WifiOff className="size-4" aria-hidden="true" />
      You&apos;re offline. Some actions won&apos;t work until your connection is back.
    </div>
  );
}

export { OfflineBanner };
