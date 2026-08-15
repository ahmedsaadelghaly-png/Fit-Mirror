/**
 * Generic debounce — delays invoking `fn` until `waitMs` have elapsed since
 * the last call. Used by `hooks/use-debounced-value.ts` for search inputs
 * across Wardrobe/Products/Users/Try-On history filters, all of which
 * currently re-filter on every keystroke (see docs/frontend/PERFORMANCE.md
 * "Debounced search"). Framework-agnostic — no React dependency — so it's
 * unit-testable in isolation.
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number,
): ((...args: Args) => void) & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Args) => {
    if (timeoutId !== null) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, waitMs);
  };

  debounced.cancel = () => {
    if (timeoutId !== null) clearTimeout(timeoutId);
    timeoutId = null;
  };

  return debounced;
}
