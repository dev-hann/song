import { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Clock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSearchQuery } from '@/queries';
import { useAudioStore } from '@/store';
import { TrackItem } from '@/components/ui/track-item';
import { ContentCard } from '@/components/ui/content-card';
import { HorizontalScroll } from '@/components/ui/horizontal-scroll';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { TrackContextMenu } from '@/components/ui/context-menu-sheet';
import { AddToPlaylistSheet } from '@/components/ui/add-to-playlist-sheet';
import { useLikeCheck } from '@/queries';
import { SearchStatus } from '@/constants';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('song_recent_searches') || '[]');
    } catch {
      return [];
    }
  });
  const [shouldSearch, setShouldSearch] = useState(!!initialQuery);

  const { data: results = [], status: queryStatus } = useSearchQuery(shouldSearch ? query : '');
  const { setAudio, setQueue } = useAudioStore();
  const navigate = useNavigate();

  const [contextTrack, setContextTrack] = useState<{
    id: string; title: string; channel: string; thumbnail: string; duration: number;
  } | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [playlistTrack, setPlaylistTrack] = useState<{
    video_id: string; title: string; channel: string; thumbnail: string; duration: number;
  } | null>(null);
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const searchStatus = (() => {
    if (!shouldSearch) return SearchStatus.IDLE;
    if (queryStatus === 'pending') return SearchStatus.LOADING;
    if (queryStatus === 'error') return SearchStatus.ERROR;
    if (queryStatus === 'success') return SearchStatus.SUCCESS;
    return SearchStatus.IDLE;
  })();

  const { data: likeCheck } = useLikeCheck(contextTrack?.id || null);

  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
      setShouldSearch(true);
    }
  }, [initialQuery]);

  const saveRecentSearch = (q: string) => {
    const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('song_recent_searches', JSON.stringify(updated));
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    saveRecentSearch(query.trim());
    setShouldSearch(true);
  };

  const handlePlayTrack = (track: typeof results[0], index: number) => {
    const audio = {
      id: track.id,
      type: 'video' as const,
      title: track.title,
      description: '',
      duration: track.duration,
      viewCount: 0,
      thumbnail: track.thumbnail,
      channel: { name: track.channel.name, thumbnail: track.channel.thumbnail },
    };
    const tracks = results.map((t) => ({
      id: t.id,
      type: 'video' as const,
      title: t.title,
      description: '',
      duration: t.duration,
      viewCount: 0,
      thumbnail: t.thumbnail,
      channel: { name: t.channel.name, thumbnail: t.channel.thumbnail },
    }));
    setQueue(tracks, index);
  };

  const handleContextMenu = (track: typeof results[0]) => {
    setContextTrack({
      id: track.id,
      title: track.title,
      channel: track.channel.name,
      thumbnail: track.thumbnail,
      duration: track.duration,
    });
    setContextOpen(true);
  };

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="relative mb-6">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) setShouldSearch(false);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="노래, 아티스트 검색..."
          className="w-full pl-11 pr-10 py-3 bg-white/5 rounded-xl text-foreground placeholder:text-muted text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setShouldSearch(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full active:bg-white/10"
          >
            <X size={16} className="text-muted" />
          </button>
        )}
      </div>

      {!shouldSearch && (
        <>
          {recentSearches.length > 0 && (
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
                    className="w-full flex items-center justify-between px-3 py-3 rounded-xl active:bg-white/5"
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
        </>
      )}

      {shouldSearch && (
        <>
          {searchStatus === SearchStatus.LOADING ? (
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
              {results.map((track, i) => (
                <TrackItem
                  key={track.id}
                  id={track.id}
                  title={track.title}
                  channel={track.channel.name}
                  thumbnail={track.thumbnail}
                  duration={track.duration}
                  onClick={() => handlePlayTrack(track, i)}
                  onMore={() => handleContextMenu(track)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted">
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          )}
        </>
      )}

      <TrackContextMenu
        open={contextOpen}
        onOpenChange={setContextOpen}
        track={contextTrack}
        isLiked={likeCheck?.liked}
        onAddToPlaylist={() => {
          if (contextTrack) {
            setPlaylistTrack({
              video_id: contextTrack.id,
              title: contextTrack.title,
              channel: contextTrack.channel,
              thumbnail: contextTrack.thumbnail,
              duration: contextTrack.duration,
            });
            setPlaylistOpen(true);
          }
        }}
        onAddToQueue={() => {
          if (contextTrack) {
            useAudioStore.getState().addToQueue({
              id: contextTrack.id,
              type: 'video',
              title: contextTrack.title,
              description: '',
              duration: contextTrack.duration,
              viewCount: 0,
              thumbnail: contextTrack.thumbnail,
              channel: { name: contextTrack.channel },
            });
          }
        }}
        onPlayNext={() => {
          if (contextTrack) {
            useAudioStore.getState().addNext({
              id: contextTrack.id,
              type: 'video',
              title: contextTrack.title,
              description: '',
              duration: contextTrack.duration,
              viewCount: 0,
              thumbnail: contextTrack.thumbnail,
              channel: { name: contextTrack.channel },
            });
          }
        }}
        onOpenInYoutube={() => {
          if (contextTrack) window.open(`https://youtube.com/watch?v=${contextTrack.id}`, '_blank');
        }}
      />

      <AddToPlaylistSheet
        open={playlistOpen}
        onOpenChange={setPlaylistOpen}
        track={playlistTrack}
      />
    </div>
  );
}
