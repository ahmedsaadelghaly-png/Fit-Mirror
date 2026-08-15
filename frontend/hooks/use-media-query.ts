"use client";

import { useEffect, useState } from "react";

/**
 * Tracks a CSS media query in JS — used sparingly, only where a
 * Tailwind responsive class can't express the behavior (e.g. choosing
 * between a Sheet and an inline sidebar based on viewport, not just
 * hiding/showing with CSS). Prefer Tailwind's `md:`/`lg:` classes for
 * anything that's purely visual.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener("change", listener);
    return () => mediaQueryList.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
