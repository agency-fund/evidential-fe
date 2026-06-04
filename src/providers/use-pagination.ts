'use client';

import { useCallback, useState } from 'react';

const DEFAULT_PAGE_SIZE = 20;

type PaginationResetKey = string | number | boolean | null | undefined;

export interface UsePaginationResult {
  /** Cursor to pass as page_token on the current request; empty string for the first page. */
  currentPageToken: string;
  /** True when at least one prior page is in the stack. Combine with `!isLoading` at the call site. */
  hasPreviousPage: boolean;
  goToPreviousPage: () => void;
  /** Push the given cursor (typically `data?.next_page_token` from the current response). No-op for empty input. */
  goToNextPage: (nextPageToken: string | undefined) => void;
  /** Drop the cursor history and jump back to page 1. */
  reset: () => void;
  pageSize: number;
  /** Updates page size and resets the cursor history (changing page size invalidates prior cursors). */
  setPageSize: (next: number) => void;
}

interface UsePaginationOptions {
  defaultPageSize?: number;
  /** Reset cursor history synchronously when this value changes. */
  resetKey?: PaginationResetKey;
}

interface PaginationState {
  pageSize: number;
  pageStack: string[];
  resetKey: PaginationResetKey;
}

/**
 * Maintains a stack of cursors for discrete Prev/Next pagination plus a user-adjustable page size.
 * Each (path, page_token) pair is its own SWR cache entry, so going back is served from cache.
 */
export function usePagination({
  defaultPageSize = DEFAULT_PAGE_SIZE,
  resetKey,
}: UsePaginationOptions = {}): UsePaginationResult {
  const [state, setState] = useState<PaginationState>(() => ({
    pageSize: defaultPageSize,
    pageStack: [''],
    resetKey,
  }));

  let { pageStack } = state;
  if (!Object.is(state.resetKey, resetKey)) {
    pageStack = [''];
    setState({ pageSize: state.pageSize, pageStack, resetKey });
  }

  const goToPreviousPage = useCallback(() => {
    setState((current) => {
      const currentPageStack = Object.is(current.resetKey, resetKey) ? current.pageStack : [''];
      return {
        ...current,
        pageStack: currentPageStack.length > 1 ? currentPageStack.slice(0, -1) : currentPageStack,
        resetKey,
      };
    });
  }, [resetKey]);

  const goToNextPage = useCallback(
    (nextPageToken: string | undefined) => {
      if (!nextPageToken) return;
      setState((current) => {
        const currentPageStack = Object.is(current.resetKey, resetKey) ? current.pageStack : [''];
        return { ...current, pageStack: [...currentPageStack, nextPageToken], resetKey };
      });
    },
    [resetKey],
  );

  const reset = useCallback(() => {
    setState((current) => ({ ...current, pageStack: [''], resetKey }));
  }, [resetKey]);

  const setPageSize = useCallback(
    (next: number) => {
      setState((current) => ({ ...current, pageSize: next, pageStack: [''], resetKey }));
    },
    [resetKey],
  );

  return {
    currentPageToken: pageStack[pageStack.length - 1],
    hasPreviousPage: pageStack.length > 1,
    goToPreviousPage,
    goToNextPage,
    reset,
    pageSize: state.pageSize,
    setPageSize,
  };
}
