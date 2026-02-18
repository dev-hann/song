'use client';

import { Search as SearchIcon, X } from 'lucide-react';
import { AudioCard } from './audio-card';
import { useSearch } from '@/hooks/use-search';
import { useAudioStore } from '@/store';
import { SearchStatus } from '@/constants';
import type { KeyboardEvent } from 'react';

/**
 * Search section component with search input, recent searches, and results display.
 * Handles search queries and displays matching audio results.
 */
export function SearchSection() {
  const { query, results, status, recentSearches, setQuery, search, clearRecentSearches, removeRecentSearch } = useSearch();
  const { setAudio } = useAudioStore();

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSearch = search;

  const handleAudioClick = (audioId: string) => {
    setAudio(audioId);
  };

  const showResults = query.trim() || results.length > 0;

  return (
    <div className="px-4 py-4">
      <div className="mb-6">
        <div className="flex-1 relative">
          <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="오디오 검색..."
            className="w-full pl-12 pr-4 py-3 bg-zinc-800 rounded-full text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          />
        </div>
      </div>

      {!showResults && recentSearches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-400">최근 검색어</h2>
            <button
              onClick={clearRecentSearches}
              className="text-xs text-zinc-500"
            >
              모두 지우기
            </button>
          </div>
          <div className="space-y-2">
            {recentSearches.map((search) => (
              <div
                key={search}
                className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 rounded-xl active:bg-zinc-800 cursor-pointer"
                 onClick={() => {
                   setQuery(search);
                 }}
              >
                <span className="text-sm text-white">{search}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentSearch(search);
                  }}
                  className="p-1"
                >
                  <X size={16} className="text-zinc-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showResults && (
        <div className="grid grid-cols-1 gap-4">
          {status === SearchStatus.LOADING ? (
            <>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="shimmer aspect-video rounded-2xl" />
              ))}
            </>
          ) : results.length > 0 ? (
            results.map((audio) => (
              <AudioCard key={audio.id} audio={audio} onClick={handleAudioClick} />
            ))
          ) : (
            <div className="text-center py-12 text-zinc-500">
              <p>검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
