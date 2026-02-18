'use client';

import { useState } from 'react';
import { useSearchQuery } from '@/queries';
import type { UseSearchReturn } from '@/types/hooks';
import { SearchStatus } from '@/constants';

/**
 * Custom hook for managing search functionality.
 * Handles search queries, results, status, and recent searches.
 * Uses TanStack Query Query Layer for API state management with caching.
 *
 * @returns Search state and handler functions
 */
export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [shouldSearch, setShouldSearch] = useState(false);

  const { data: results = [], status: queryStatus } = useSearchQuery(
    shouldSearch ? query : ''
  );

  const status = (() => {
    if (!shouldSearch) return SearchStatus.IDLE;
    if (queryStatus === 'pending') return SearchStatus.LOADING;
    if (queryStatus === 'error') return SearchStatus.ERROR;
    if (queryStatus === 'success') return SearchStatus.SUCCESS;
    return SearchStatus.IDLE;
  })();

  const search = async () => {
    if (!query.trim()) return;

    if (!recentSearches.includes(query)) {
      setRecentSearches([query, ...recentSearches.slice(0, 9)]);
    }

    setShouldSearch(true);
  };

  const clearResults = () => {
    setShouldSearch(false);
    setQuery('');
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  const removeRecentSearch = (search: string) => {
    setRecentSearches(recentSearches.filter(s => s !== search));
  };

  return {
    query,
    results,
    status,
    recentSearches,
    setQuery,
    search,
    clearResults,
    clearRecentSearches,
    removeRecentSearch
  };
}
