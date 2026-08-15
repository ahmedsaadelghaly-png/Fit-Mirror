import { useEffect, useState } from "react";

/**
 * Returns `value`, but delayed by `delayMs` since its last change — the
 * standard "debounce a controlled input" pattern. Every search filter
 * built in Phases 2.3–2.5 (Wardrobe, Products, Users, Try-On history, ...)
 * currently re-filters synchronously on every keystroke; swapping the raw
 * filter value for this hook's output cuts that to one filter pass per
 * pause in typing, with no change to the filter logic itself. See
 * docs/frontend/PERFORMANCE.md "Debounced search".
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debounced;
}
