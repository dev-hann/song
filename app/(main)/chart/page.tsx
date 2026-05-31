'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Play } from 'lucide-react';
import Image from 'next/image';
import { useMelonChart } from '@/queries';
import { useAudioStore } from '@/store';
import { Skeleton } from '@/components/ui/skeleton';
import { TrackContextMenu } from '@/components/ui/context-menu-sheet';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { MelonChartItem } from '@/types';
import type { MelonChartType } from '@/services/api';
import { searchResultToAudio } from '@/lib/track-adapters';
import { useTrackContextMenu } from '@/hooks/use-track-context-menu';

const TABS: { key: MelonChartType; label: string }[] = [
  { key: 'realtime', label: '실시간' },
  { key: 'hot100', label: 'HOT 100' },
  { key: 'daily', label: '일간' },
];

function ChartItem({
  item,
  isLoading,
  onPlay,
}: {
  item: MelonChartItem;
  isLoading: boolean;
  onPlay: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPlay}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onPlay();
        }
      }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl active:bg-white/5 transition-colors ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
    >
      <span className="w-7 text-right text-sm font-semibold text-muted tabular-nums flex-shrink-0">
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
    </div>
  );
}

export default function MelonChartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = useMemo(() => {
    const raw = searchParams.get('type') ?? 'realtime';
    return TABS.some((t) => t.key === raw) ? (raw as MelonChartType) : 'realtime';
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<MelonChartType>(initialType);
  const { data: chart, isLoading } = useMelonChart(activeTab);
  const { setQueue } = useAudioStore();
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

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

  const openChartContext = async (index: number) => {
    if (!chart?.length || loadingIndex != null) {return;}
    const item = chart[index];
    setLoadingIndex(index);
    try {
      const { fetchSearch } = await import('@/services/api');
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
      setLoadingIndex(null);
    }
  };

  const playAllFrom = async (startIndex: number) => {
    if (!chart?.length || loadingIndex != null) {return;}
    setLoadingIndex(startIndex);
    try {
      const { fetchSearch } = await import('@/services/api');
      const item = chart[startIndex];
      const results = await fetchSearch(`${item.title} ${item.artist}`);
      if (results.length > 0) {
        const firstTrack = results.slice(0, 1).map(searchResultToAudio);
        setQueue(firstTrack, 0);

        const remaining = chart.slice(startIndex + 1);
        for (const chartItem of remaining) {
          try {
            const r = await fetchSearch(`${chartItem.title} ${chartItem.artist}`);
            if (r.length > 0) {
              useAudioStore.getState().addToQueue(searchResultToAudio(r[0]));
            }
          } catch {
            continue;
          }
        }
      } else {
        toast.error('검색 결과를 찾을 수 없습니다');
      }
    } catch {
      toast.error('재생 중 오류가 발생했습니다');
    } finally {
      setLoadingIndex(null);
    }
  };

  return (
    <div className="pt-6 pb-4">
      <div className="px-4 flex items-center gap-3 mb-4">
        <button onClick={() => { router.back(); }} className="p-2 -ml-2 rounded-full active:bg-white/5">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
      </div>

      <div className="px-4 mb-4">
        <h1 className="text-xl font-bold text-foreground">멜론 차트</h1>
      </div>

      <div className="flex gap-1 px-4 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-foreground text-background'
                : 'bg-white/5 text-muted active:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 mb-4 flex items-end justify-between">
        <p className="text-xs text-muted">{chart?.length ?? 0}곡</p>
        {chart && chart.length > 0 && (
          <button
            onClick={() => { playAllFrom(0).catch(() => undefined); }}
            disabled={loadingIndex != null}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium active:scale-95 transition-transform disabled:opacity-60"
          >
            {loadingIndex != null ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
            전체 재생
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-0.5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <Skeleton className="w-7 text-center rounded" />
              <Skeleton className="w-11 h-11 rounded-md flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 rounded mb-1" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-0.5">
          {chart?.map((item) => (
            <ChartItem
              key={item.rank}
              item={item}
              isLoading={loadingIndex === item.rank - 1}
              onPlay={() => { openChartContext(item.rank - 1).catch(() => undefined); }}
            />
          ))}
        </div>
      )}

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
