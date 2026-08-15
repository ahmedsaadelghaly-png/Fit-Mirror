import { useMemo, useState } from "react";

import { paginate } from "@/lib/performance/paginate";

/**
 * Thin React wrapper around `paginate()` — owns the current page number
 * and resets to page 1 whenever the underlying item count shrinks below
 * the current page (e.g. a filter narrows the list) so the view never
 * gets stuck on an empty page. See docs/frontend/PERFORMANCE.md
 * "Pagination strategy".
 */
export function usePagination<T>(items: T[], pageSize = 20) {
  const [page, setPage] = useState(1);

  const result = useMemo(() => paginate(items, page, pageSize), [items, page, pageSize]);

  const goToPage = (nextPage: number) => {
    setPage(Math.min(Math.max(1, nextPage), result.pageCount));
  };

  return {
    ...result,
    goToPage,
    nextPage: () => goToPage(page + 1),
    previousPage: () => goToPage(page - 1),
  };
}
