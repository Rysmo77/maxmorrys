import { useState, useMemo } from 'react';

const DEFAULT_PER_PAGE = 20;

export function usePagination<T>(items: T[], perPage = DEFAULT_PER_PAGE) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  // Reset to page 1 when filtered results change and current page is out of bounds
  const safePage = page > totalPages ? 1 : page;

  const paged = useMemo(
    () => items.slice((safePage - 1) * perPage, safePage * perPage),
    [items, safePage, perPage],
  );

  return {
    paged,
    page: safePage,
    totalPages,
    setPage,
    total: items.length,
  };
}
