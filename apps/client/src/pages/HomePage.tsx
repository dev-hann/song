import { useHomeData } from '@/queries';
import { useAudioStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Loader2, Sparkles, Music } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { MelonChartItem, SearchResultAudio } from '@/types';
import type { MelonChartType } from '@/services/api';
import { formatDuration } from '@/lib/formatters';

const CHART_TABS: { key: 'chart' | 'hot100' | 'dailyChart'; label: string; type: MelonChartType }[] = [
  { key: 'chart', label: '실시간', type: 'realtime' },
  { key: 'hot100', label: 'HOT 100', type: 'hot100' },
  { key: 'dailyChart', label: '일간', type: 'daily' },
];

function RecommendationItem({
  track,
  onPlay,
}: {
  track: SearchResultAudio;
  onPlay: () => void;
}) {
  return (
    <button
      onClick={onPlay}
      className="flex-shrink-0 w-36 active:scale-95 transition-transform"
    >
      <div className="w-36 h-36 rounded-xl overflow-hidden bg-surface relative">
        {track.thumbnail && (
          <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" loading="lazy" />
        )}
        {track.duration > 0 && (
          <span className="absolute bottom-1 right-1 text-[10px] bg-black/70 text-white px-1 py-0.5 rounded">
            {formatDuration(track.duration)}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-foreground mt-1.5 line-clamp-2 text-left">{track.title}</p>
      <p className="text-[11px] text-muted truncate text-left">{track.channel.name}</p>
    </button>
  );
}

function ChartItemRow({
  item,
  isLoading,
  onPlay,
}: {
  item: MelonChartItem;
  isLoading: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      onClick={onPlay}
      disabled={isLoading}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl active:bg-white/5 transition-colors disabled:opacity-60"
    >
      <span className="w-6 text-right text-sm font-semibold text-muted tabular-nums flex-shrink-0">
        {isLoading ? (
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
        <p className="text-xs text-muted truncate">{item.artist}</p>
      </div>
    </button>
  );
}

function ChartSectionSkeleton() {
  return (
    <div className="space-y-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
          <Skeleton className="w-6 text-center rounded" />
          <Skeleton className="w-11 h-11 rounded-md flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 rounded mb-1" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecommendationSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 -mx-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-36">
          <Skeleton className="w-36 h-36 rounded-xl" />
          <Skeleton className="h-3 w-4/5 rounded mt-1.5" />
          <Skeleton className="h-2.5 w-3/5 rounded mt-1" />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { data, isLoading } = useHomeData();
  const { setQueue, setAudio } = useAudioStore();
  const navigate = useNavigate();
  const [loadingChartKey, setLoadingChartKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'hot100' | 'dailyChart'>('chart');

  const activeChart = data?.[activeTab];
  const activeType = CHART_TABS.find((t) => t.key === activeTab)!.type;
  const recommendations = data?.recommendations;

  const playChart = async (index: number) => {
    if (!activeChart?.length || loadingChartKey !== null) return;
    setLoadingChartKey(`${activeTab}-${index}`);
    try {
      const { fetchSearch } = await import('@/services/api');
      const item = activeChart[index];
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
      } else {
        toast.error('검색 결과를 찾을 수 없습니다');
      }
    } catch {
      toast.error('재생 중 오류가 발생했습니다');
    } finally {
      setLoadingChartKey(null);
    }
  };

  const playRecommendation = (track: SearchResultAudio, list: SearchResultAudio[]) => {
    const idx = list.indexOf(track);
    setQueue(
      list.map((r) => ({
        id: r.id,
        type: 'video' as const,
        title: r.title,
        description: '',
        duration: r.duration,
        viewCount: 0,
        thumbnail: r.thumbnail,
        channel: { name: r.channel.name, thumbnail: r.channel.thumbnail },
      })),
      Math.max(0, idx),
    );
  };

  return (
    <div className="pb-4">
      <div className="px-4 pt-6 mb-6">
        <h1 className="text-2xl font-bold text-foreground">듣기</h1>
      </div>

      {recommendations && (recommendations.fromChannels.length > 0 || recommendations.fromRecent.length > 0) && (
        <section className="mb-10">
          <div className="flex items-center gap-2 px-4 mb-4">
            <Sparkles size={16} className="text-foreground" />
            <h2 className="text-base font-bold text-foreground">맞춤 추천</h2>
          </div>

          {recommendations.fromChannels.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 px-4 mb-3">
                <Music size={12} className="text-muted" />
                <span className="text-xs text-muted font-medium">자주 듣는 채널</span>
              </div>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 -mx-4">
                {recommendations.fromChannels.map((track) => (
                  <RecommendationItem
                    key={track.id}
                    track={track}
                    onPlay={() => playRecommendation(track, recommendations.fromChannels)}
                  />
                ))}
              </div>
            </div>
          )}

          {recommendations.fromRecent.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-4 mb-3">
                <Sparkles size={12} className="text-muted" />
                <span className="text-xs text-muted font-medium">이런 곡은 어때요?</span>
              </div>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 -mx-4">
                {recommendations.fromRecent.map((track) => (
                  <RecommendationItem
                    key={track.id}
                    track={track}
                    onPlay={() => playRecommendation(track, recommendations.fromRecent)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {isLoading && !recommendations && (
        <section className="mb-10">
          <div className="flex items-center gap-2 px-4 mb-4">
            <Sparkles size={16} className="text-foreground" />
            <h2 className="text-base font-bold text-foreground">맞춤 추천</h2>
          </div>
          <RecommendationSkeleton />
        </section>
      )}

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
                  setAudio({
                    id: item.video_id,
                    type: 'video',
                    title: item.title,
                    description: '',
                    duration: item.duration,
                    viewCount: 0,
                    thumbnail: item.thumbnail,
                    channel: { name: item.channel },
                  });
                }}
                className="flex-shrink-0 w-28 active:scale-95 transition-transform"
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

      <section className="mb-8">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex gap-1">
            {CHART_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-foreground text-background'
                    : 'bg-white/5 text-muted active:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate(`/chart?type=${activeType}`)}
            className="flex items-center gap-0.5 text-xs text-muted active:text-foreground"
          >
            더보기
            <ChevronRight size={14} />
          </button>
        </div>

        {isLoading ? (
          <ChartSectionSkeleton />
        ) : (
          <div className="space-y-0.5">
            {activeChart?.map((item, i) => (
              <ChartItemRow
                key={`${activeTab}-${item.rank}`}
                item={item}
                isLoading={loadingChartKey === `${activeTab}-${i}`}
                onPlay={() => playChart(i)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
