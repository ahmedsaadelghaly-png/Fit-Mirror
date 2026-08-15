"use client";

import { useEffect, useState } from "react";

/**
 * Returns true only after the component has mounted on the client.
 * Needed anywhere that reads client-only state (e.g. the resolved theme
 * from next-themes) to avoid a server/client markup mismatch — render a
 * neutral placeholder until `mounted` is true, then the real value.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
