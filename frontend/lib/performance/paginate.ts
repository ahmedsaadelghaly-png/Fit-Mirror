/**
 * Client-side pagination utility. Every list endpoint this app calls
 * (`GET /wardrobe`, `GET /tryon`, `GET /store/products`, ...) returns its
 * full result set with no `page`/`limit`/`cursor` params at all (confirmed
 * across Phases 2.3/2.4/2.5 backend research) — so real pagination isn't
 * possible yet. This paginates the already-fetched array client-side,
 * ready to delete the moment a backend list endpoint adds real pagination
 * (only the fetch layer would change; consumers of `paginate()` wouldn't).
 */
export interface PaginationResult<T> {
  items: T[];
  page: number;
  pageCount: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function paginate<T>(allItems: T[], page: number, pageSize: number): PaginationResult<T> {
  const totalCount = allItems.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;

  return {
    items: allItems.slice(start, start + pageSize),
    page: safePage,
    pageCount,
    totalCount,
    hasNextPage: safePage < pageCount,
    hasPreviousPage: safePage > 1,
  };
}
