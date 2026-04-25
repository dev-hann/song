import { useHomeData } from '@/queries';
import { useAudioStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, ChevronRight, Loader2 } from 'lucide-react';
import { TrackContextMenu } from '@/components/ui/context-menu-sheet';
import { AddToPlaylistSheet } from '@/components/ui/add-to-playlist-sheet';
import { useState } from 'react';

const genres = [
  { label: 'K-Pop', query: 'K-Pop 2025', gradient: 'from-pink-500 to-rose-900' },
  { label: '발라드', query: '한국 발라드', gradient: 'from-blue-500 to-indigo-900' },
  { label: '힙합', query: '한국 힙합', gradient: 'from-purple-500 to-violet-900' },
  { label: 'R&B', query: 'K-R&B', gradient: 'from-orange-500 to-amber-900' },
  { label: '인디', query: '한국 인디', gradient: 'from-emerald-500 to-green-900' },
  { label: '록', query: '한국 록', gradient: 'from-red-500 to-rose-950' },
  { label: '재즈', query: '재즈', gradient: 'from-yellow-500 to-amber-950' },
  { label: '팝', query: 'Pop Music 2025', gradient: 'from-sky-400 to-blue-900' },
];

function ChartItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <Skeleton className="w-8 text-center rounded" />
      <Skeleton className="w-11 h-11 rounded-md flex-shrink-0" />
      <Skeleton className="h-4 w-3/4 rounded" />
    </div>
  );
}

export default function HomePage() {
  const { data, isLoading } = useHomeData();
  const { setQueue } = useAudioStore();
  const navigate = useNavigate();

  const [contextTrack, setContextTrack] = useState<{
    id: string; title: string; channel: string; thumbnail: string; duration: number;
  } | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [playlistTrack, setPlaylistTrack] = useState<{
    video_id: string; title: string; channel: string; thumbnail: string; duration: number;
  } | null>(null);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [loadingChartIndex, setLoadingChartIndex] = useState<number | null>(null);

  const playChart = async (index: number) => {
    if (!data?.chart?.length || loadingChartIndex !== null) return;
    setLoadingChartIndex(index);
    try {
      const { fetchSearch } = await import('@/services/api');
      const item = data.chart[index];
      const results = await fetchSearch(`${item.title} ${item.artist}`);
      if (results.length > 0) {
        setQueue(
          results.slice(0, 10).map((r) => ({
            id: r.id,
            type: 'video' as const,
            title: r.title,
            description: '',
            duration: r.duration,
            viewCount: 0,
            thumbnail: r.thumbnail,
            channel: { name: r.channel.name, thumbnail: r.channel.thumbnail },
          })),
          0,
        );
      }
    } finally {
      setLoadingChartIndex(null);
    }
  };

  const featured = data?.chart?.[0];

  const toOriginal = (url: string) => url.replace('/melon/resize/200/quality/80/optimize', '');

  return (
    <div className="pb-4">
      <div className="px-4 pt-6 mb-6">
        <h1 className="text-2xl font-bold text-foreground">듣기</h1>
      </div>

      {isLoading ? (
        <div className="px-4 mb-8">
          <Skeleton className="w-full aspect-[16/9] rounded-2xl" />
        </div>
      ) : featured ? (
        <div className="px-4 mb-8">
          <button
            onClick={() => playChart(0)}
            disabled={loadingChartIndex !== null}
            className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden active:scale-[0.99] transition-transform disabled:opacity-80"
          >
            {featured.albumArt && (
              <img
                src={toOriginal(featured.albumArt)}
                alt={featured.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-white truncate">{featured.title}</p>
                <p className="text-sm text-white/60 mt-0.5">{featured.artist}</p>
              </div>
              <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 ml-3">
                {loadingChartIndex === 0 ? (
                  <Loader2 size={20} className="text-white animate-spin" />
                ) : (
                  <Play size={20} fill="white" className="text-white ml-0.5" />
                )}
              </div>
            </div>
            <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md">
              <span className="text-[10px] font-bold text-white/90 tracking-wider">멜론 1위</span>
            </div>
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <section className="mb-10">
          <div className="flex items-center justify-between px-4 mb-4">
            <Skeleton className="h-5 w-20 rounded" />
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 -mx-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="flex-shrink-0 w-28 h-28 rounded-xl" />
            ))}
          </div>
        </section>
      ) : data?.recent && data.recent.length > 0 ? (
        <section className="mb-10">
          <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="text-base font-bold text-foreground">최근 재생</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 -mx-4">
            {data.recent.slice(0, 10).map((item) => (
              <button
                key={item.video_id}
                onClick={() => {
                  useAudioStore.getState().setAudioById(item.video_id);
                }}
                className="flex-shrink-0 w-28"
              >
                <div className="w-28 h-28 rounded-xl overflow-hidden bg-surface mb-0">
                  {item.thumbnail && (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-10">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-base font-bold text-foreground">인기 차트</h2>
          <button
            onClick={() => navigate('/search?q=' + encodeURIComponent('멜론 차트 2025'))}
            className="flex items-center gap-0.5 text-xs text-muted active:text-foreground"
          >
            더보기
            <ChevronRight size={14} />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-0.5">
            {Array.from({ length: 5 }).map((_, i) => <ChartItemSkeleton key={i} />)}
          </div>
        ) : (
          <div className="space-y-0.5">
            {data?.chart?.slice(0, 5).map((item) => (
              <button
                key={item.rank}
                onClick={() => playChart(data.chart.indexOf(item))}
                disabled={loadingChartIndex !== null}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl active:bg-white/5 transition-colors group disabled:opacity-60"
              >
                <span className="w-6 text-right text-sm font-semibold text-muted tabular-nums flex-shrink-0">
                  {loadingChartIndex === data.chart.indexOf(item) ? (
                    <Loader2 size={14} className="text-foreground animate-spin inline" />
                  ) : (
                    item.rank
                  )}
                </span>
                <div className="w-11 h-11 rounded-md overflow-hidden bg-surface flex-shrink-0">
                  {item.albumArt && (
                    <img src={item.albumArt} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onKeyDown={() => {}}
                  className="p-1.5 -mr-1.5 rounded-full opacity-0 group-hover:opacity-100 active:bg-white/10"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted">
                    <circle cx="3" cy="8" r="1.5" fill="currentColor" />
                    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                    <circle cx="13" cy="8" r="1.5" fill="currentColor" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8 px-4">
        <h2 className="text-base font-bold text-foreground mb-3">탐색</h2>
        <div className="grid grid-cols-4 gap-2">
          {genres.map((genre) => (
            <button
              key={genre.label}
              onClick={() => navigate(`/search?q=${encodeURIComponent(genre.query)}`)}
              className={`relative overflow-hidden rounded-xl h-16 bg-gradient-to-br ${genre.gradient} active:scale-95 transition-transform`}
            >
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
                {genre.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      <TrackContextMenu
        open={contextOpen}
        onOpenChange={setContextOpen}
        track={contextTrack}
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
