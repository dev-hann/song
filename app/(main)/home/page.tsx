'use client';

import { useHomeData } from '@/queries';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ChevronRight, Loader2, Sparkles, Music } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import type { MelonChartItem, SearchResultAudio } from '@/types';
import type { MelonChartType } from '@/services/api';
import { TrackCard } from '@/components/ui/track-card';
import { TrackContextMenu } from '@/components/ui/context-menu-sheet';
import { useTrackContextMenu } from '@/hooks/use-track-context-menu';

const CHART_TABS: { key: 'chart' | 'hot100' | 'dailyChart'; label: string; type: MelonChartType }[] = [
  { key: 'chart', label: '실시간', type: 'realtime' },
  { key: 'hot100', label: 'HOT 100', type: 'hot100' },
  { key: 'dailyChart', label: '일간', type: 'daily' },
];

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
      data-testid="chart-item"
      onClick={onPlay}
      disabled={isLoading}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl active:bg-accent transition-colors disabled:opacity-60"
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
          <Image src={item.albumArt} alt={item.title} className="w-full h-full object-cover" loading="lazy" unoptimized width={44} height={44} />
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
  const router = useRouter();
  const [loadingChartKey, setLoadingChartKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'hot100' | 'dailyChart'>('chart');

  const {
    contextTrack,
    contextOpen,
    setContextOpen,
    openContext,
    playNow,
    addToQueue,
    playNext,
    openInYoutube,
    share,
  } = useTrackContextMenu();

  const activeChart = data?.[activeTab];
  const activeType = CHART_TABS.find((t) => t.key === activeTab)?.type ?? 'realtime';
  const recommendations = data?.recommendations;

  const openChartContextMenu = async (index: number) => {
    if (!activeChart?.length || loadingChartKey != null) {return;}
    setLoadingChartKey(`${activeTab}-${index}`);
    try {
      const { fetchSearch } = await import('@/services/api');
      const item = activeChart[index];
      const results = await fetchSearch(`${item.title} ${item.artist}`);
      if (results.length > 0) {
        const r = results[0];
        openContext({
          id: r.id,
          title: r.title,
          channel: r.channel.name,
          thumbnail: r.thumbnail,
          duration: r.duration,
        });
      } else {
        toast.error('검색 결과를 찾을 수 없습니다');
      }
    } catch {
      toast.error('오류가 발생했습니다');
    } finally {
      setLoadingChartKey(null);
    }
  };

  const openRecommendationContext = (track: SearchResultAudio) => {
    openContext({
      id: track.id,
      title: track.title,
      channel: track.channel.name,
      thumbnail: track.thumbnail,
      duration: track.duration,
    });
  };

  return (
    <div className="pb-4">
      <div className="px-4 pt-6 mb-6">
        <h1 className="text-2xl font-bold text-foreground">듣기</h1>
      </div>

      {recommendations && (recommendations.fromChannels.length > 0 || recommendations.fromRecent.length > 0 || recommendations.fromChart.length > 0) && (
        <section className="mb-10">
          <div className="flex items-center gap-2 px-4 mb-4">
            <Sparkles size={16} className="text-foreground" />
            <h2 className="text-base font-bold text-foreground">맞춤 추천</h2>
          </div>

          {recommendations.fromChart.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 px-4 mb-3">
                <Music size={12} className="text-muted" />
                <span className="text-xs text-muted font-medium">인기 아티스트의 음악</span>
              </div>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 -mx-4">
                {recommendations.fromChart.map((track) => (
                  <TrackCard
                    key={track.id}
                    variant="square"
                    id={track.id}
                    title={track.title}
                    channel={track.channel.name}
                    thumbnail={track.thumbnail}
                    duration={track.duration}
                    onClick={() => { openRecommendationContext(track); }}
                  />
                ))}
              </div>
            </div>
          )}

          {recommendations.fromChannels.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 px-4 mb-3">
                <Music size={12} className="text-muted" />
                <span className="text-xs text-muted font-medium">자주 듣는 채널</span>
              </div>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 -mx-4">
                {recommendations.fromChannels.map((track) => (
                  <TrackCard
                    key={track.id}
                    variant="square"
                    id={track.id}
                    title={track.title}
                    channel={track.channel.name}
                    thumbnail={track.thumbnail}
                    duration={track.duration}
                    onClick={() => { openRecommendationContext(track); }}
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
                  <TrackCard
                    key={track.id}
                    variant="square"
                    id={track.id}
                    title={track.title}
                    channel={track.channel.name}
                    thumbnail={track.thumbnail}
                    duration={track.duration}
                    onClick={() => { openRecommendationContext(track); }}
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
                key={item.videoId}
                onClick={() => {
                  openContext({
                    id: item.videoId,
                    title: item.title,
                    channel: item.channel,
                    thumbnail: item.thumbnail,
                    duration: item.duration,
                  });
                }}
                className="flex-shrink-0 w-28 active:scale-95 transition-transform"
              >
                <div className="w-28 h-28 rounded-xl overflow-hidden bg-surface mb-0">
                  {item.thumbnail && (
                    <Image src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" loading="lazy" unoptimized width={112} height={112} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-8">
        <div className="flex items-center justify-between px-4 mb-3">
          <SegmentedControl options={CHART_TABS} value={activeTab} onChange={(key) => { setActiveTab(key as typeof activeTab); }} size="sm" />
          <button
            onClick={() => { router.push(`/chart?type=${activeType}`); }}
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
                onPlay={() => { openChartContextMenu(i).catch(() => undefined); }}
              />
            ))}
          </div>
        )}
      </section>

      <TrackContextMenu
        open={contextOpen}
        onOpenChange={setContextOpen}
        track={contextTrack}
        onPlay={playNow}
        onAddToQueue={addToQueue}
        onPlayNext={playNext}
        onShare={share}
        onOpenInYoutube={openInYoutube}
      />
    </div>
  );
}
