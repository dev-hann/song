'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon, X, Clock, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useSearchQuery, useLikeCheck } from '@/queries';
import { TrackItem } from '@/components/ui/track-item';
import { Skeleton } from '@/components/ui/skeleton';
import { TrackContextMenu } from '@/components/ui/context-menu-sheet';
import { AddToPlaylistSheet } from '@/components/ui/add-to-playlist-sheet';
import { SearchStatus } from '@/constants';
import { useTrackContextMenu } from '@/hooks/use-track-context-menu';
import type { SearchResultAudio } from '@/types';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem('song_recent_searches') ?? '[]');
      return Array.isArray(parsed) ? parsed as string[] : [];
    } catch {
      return [];
    }
  });
  const [shouldSearch, setShouldSearch] = useState(!!initialQuery);

  const {
    data,
    status: queryStatus,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchQuery(shouldSearch ? query : '');

  const results = useMemo(() => {
    if (!data) {return [];}
    return data.pages.flatMap((page) => page.results);
  }, [data]);

  const {
    contextTrack,
    contextOpen,
    setContextOpen,
    playlistTrack,
    playlistOpen,
    setPlaylistOpen,
    openContext,
    openPlaylist,
    playNow,
    addToQueue,
    playNext,
    openInYoutube,
    share,
  } = useTrackContextMenu();

  const searchStatus = useMemo(() => {
    if (!shouldSearch) {return SearchStatus.IDLE;}
    if (queryStatus === 'pending') {return SearchStatus.LOADING;}
    if (queryStatus === 'error') {return SearchStatus.ERROR;}
    return SearchStatus.SUCCESS;
  }, [shouldSearch, queryStatus]);

  const { data: likeCheck } = useLikeCheck(contextTrack?.id ?? null);

  const saveRecentSearch = (q: string) => {
    const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('song_recent_searches', JSON.stringify(updated));
  };

  const handleSearch = () => {
    if (!query.trim()) {return;}
    saveRecentSearch(query.trim());
    setShouldSearch(true);
  };

  const handlePlayTrack = (track: SearchResultAudio) => {
    openContext({
      id: track.id,
      title: track.title,
      channel: track.channel.name,
      thumbnail: track.thumbnail,
      duration: track.duration,
    });
  };

  const sentinelRef = useRef<HTMLDivElement>(null);

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage().catch((err: unknown) => { console.error('[Search] fetchNextPage failed:', err); });
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {return;}
    const observer = new IntersectionObserver(observerCallback, { rootMargin: '200px' });
    observer.observe(sentinel);
    return () => { observer.disconnect(); };
  }, [observerCallback]);

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="relative mb-6">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) {setShouldSearch(false);}
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {handleSearch();}
          }}
          placeholder="노래, 아티스트 검색..."
          className="w-full pl-11 pr-10 py-3 bg-accent rounded-xl text-foreground placeholder:text-muted text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setShouldSearch(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full active:bg-secondary"
          >
            <X size={16} className="text-muted" />
          </button>
        )}
      </div>

      {!shouldSearch && recentSearches.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-muted">최근 검색</h2>
                <button
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('song_recent_searches');
                  }}
                  className="text-xs text-muted-foreground"
                >
                  전체 삭제
                </button>
              </div>
              <div className="space-y-0.5">
                {recentSearches.map((search) => (
                  <div
                    key={search}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setQuery(search);
                      saveRecentSearch(search);
                      setShouldSearch(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setQuery(search);
                        saveRecentSearch(search);
                        setShouldSearch(true);
                      }
                    }}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-xl active:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-muted-foreground" />
                      <span className="text-sm text-foreground">{search}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = recentSearches.filter((s) => s !== search);
                        setRecentSearches(updated);
                        localStorage.setItem('song_recent_searches', JSON.stringify(updated));
                      }}
                      className="p-1"
                    >
                      <X size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
      )}

      {shouldSearch && (
        searchStatus === SearchStatus.LOADING && results.length === 0 ? (
          <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2">
                  <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 rounded mb-2" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-0.5">
              {results.map((track) => (
                <TrackItem
                  key={track.id}
                  id={track.id}
                  title={track.title}
                  channel={track.channel.name}
                  thumbnail={track.thumbnail}
                  duration={track.duration}
                  onClick={() => { handlePlayTrack(track); }}
                />
              ))}
              <div ref={sentinelRef} className="h-4" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 size={20} className="animate-spin text-muted" />
                </div>
              )}
          </div>
        ) : (
          <div className="text-center py-16 text-muted">
            <p className="text-sm">검색 결과가 없습니다</p>
          </div>
        )
      )}

      <TrackContextMenu
        open={contextOpen}
        onOpenChange={setContextOpen}
        track={contextTrack}
        isLiked={likeCheck?.liked}
        onPlay={playNow}
        onAddToPlaylist={openPlaylist}
        onAddToQueue={addToQueue}
        onPlayNext={playNext}
        onShare={share}
        onOpenInYoutube={openInYoutube}
      />

      <AddToPlaylistSheet
        open={playlistOpen}
        onOpenChange={setPlaylistOpen}
        track={playlistTrack}
      />
    </div>
  );
}
