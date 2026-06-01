'use client';

import { useCallback, useState } from 'react';

const DEFAULT_PAGE_SIZE = 20;

export interface UsePaginationResult {
  /** Cursor to pass as page_token on the current request; empty string for the first page. */
  currentPageToken: string;
  /** True when at least one prior page is in the stack. Combine with `!isLoading` at the call site. */
  hasPreviousPage: boolean;
  goToPreviousPage: () => void;
  /** Push the given cursor (typically `data?.next_page_token` from the current response). No-op for empty input. */
  goToNextPage: (nextPageToken: string | undefined) => void;
  /** Drop the cursor history; call from search/filter handlers to jump back to page 1. */
  reset: () => void;
  pageSize: number;
  /** Updates page size and resets the cursor history (changing page size invalidates prior cursors). */
  setPageSize: (next: number) => void;
}

interface UsePaginationOptions {
  defaultPageSize?: number;
}

/**
 * Maintains a stack of cursors for discrete Prev/Next pagination plus a user-adjustable page size.
 * Each (path, page_token) pair is its own SWR cache entry, so going back is served from cache.
 */
export function usePagination({ defaultPageSize = DEFAULT_PAGE_SIZE }: UsePaginationOptions = {}): UsePaginationResult {
  const [pageStack, setPageStack] = useState<string[]>(['']);
  const [pageSize, setPageSizeState] = useState<number>(defaultPageSize);

  const goToPreviousPage = useCallback(() => {
    setPageStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack));
  }, []);

  const goToNextPage = useCallback((nextPageToken: string | undefined) => {
    if (!nextPageToken) return;
    setPageStack((stack) => [...stack, nextPageToken]);
  }, []);

  const reset = useCallback(() => setPageStack(['']), []);

  const setPageSize = useCallback((next: number) => {
    setPageSizeState(next);
    setPageStack(['']);
  }, []);

  return {
    currentPageToken: pageStack[pageStack.length - 1],
    hasPreviousPage: pageStack.length > 1,
    goToPreviousPage,
    goToNextPage,
    reset,
    pageSize,
    setPageSize,
  };
}
