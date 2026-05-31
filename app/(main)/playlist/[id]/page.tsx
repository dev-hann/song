'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
import { Play, Shuffle, ArrowLeft, MoreVertical, Pencil, ArrowUpDown, Search, X, Copy, Share2, FolderInput, Zap } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import { usePlaylist, useDeletePlaylist, useRemoveTrackFromPlaylist, useReorderPlaylistTracks, useDuplicatePlaylist, useSmartPlaylistTracks } from '@/queries';
import { TrackItem } from '@/components/ui/track-item';
import { SortableTrackItem } from '@/components/ui/sortable-track-item';
import { CheckboxTrackItem } from '@/components/ui/checkbox-track-item';
import { TrackContextMenu } from '@/components/ui/context-menu-sheet';
import { AddToPlaylistSheet } from '@/components/ui/add-to-playlist-sheet';
import { useAudioStore } from '@/store';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { playlistTrackToAudio } from '@/lib/track-adapters';
import { formatTotalDuration } from '@/lib/formatters';
import { sortTracks, type SortBy } from '@/lib/sort-tracks';
import { filterTracks } from '@/lib/filter-tracks';
import { useTrackContextMenu } from '@/hooks/use-track-context-menu';
import { EditPlaylistDialog } from '@/components/ui/edit-playlist-dialog';
import { SmartPlaylistDialog } from '@/components/ui/smart-playlist-dialog';
import { SharePlaylistDialog } from '@/components/ui/share-playlist-dialog';
import { MoveToFolderSheet } from '@/components/ui/move-to-folder-sheet';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'default', label: '기본 순서' },
  { value: 'title', label: '제목순' },
  { value: 'channel', label: '아티스트순' },
  { value: 'addedAt', label: '최근 추가순' },
  { value: 'duration', label: '재생시간순' },
];

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: playlist, isLoading } = usePlaylist(id);
  const { data: smartTracks } = useSmartPlaylistTracks(id, !!playlist?.rules);
  const deletePlaylist = useDeletePlaylist();
  const removeTrack = useRemoveTrackFromPlaylist();
  const reorderTracks = useReorderPlaylistTracks(id);
  const duplicatePlaylist = useDuplicatePlaylist();
  const [editOpen, setEditOpen] = useState(false);
  const [smartOpen, setSmartOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [moveFolderOpen, setMoveFolderOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('default');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [batchSheetOpen, setBatchSheetOpen] = useState(false);
  const { setQueue } = useAudioStore();

  const {
    contextTrack,
    contextOpen,
    setContextOpen,
    openContext,
    addToQueue,
    playNext,
    openInYoutube,
  } = useTrackContextMenu();

  const displayedTracks = useMemo(() => {
    const sourceTracks = playlist?.rules ? (smartTracks ?? []) : (playlist?.tracks ?? []);
    let result = sortTracks(sourceTracks, sortBy);
    if (searchQuery.trim()) {
      result = filterTracks(result, searchQuery);
    }
    return result;
  }, [playlist?.rules, playlist?.tracks, smartTracks, sortBy, searchQuery]);

  const handlePlay = (index: number) => {
    if (!displayedTracks.length) {return;}
    setQueue(displayedTracks.map(playlistTrackToAudio), index);
  };

  const handleShuffle = () => {
    if (!playlist?.tracks?.length) {return;}
    const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
    setQueue(shuffled.map(playlistTrackToAudio), 0);
  };

  const handleRemoveFromPlaylist = async () => {
    if (!id || !contextTrack) {return;}
    try {
      await removeTrack.mutateAsync({ playlistId: id, videoId: contextTrack.id });
      toast.success('트랙이 재생목록에서 제거되었습니다');
    } catch {
      toast.error('제거에 실패했습니다');
    }
  };

  const handleDelete = async () => {
    if (!id) {return;}
    try {
      await deletePlaylist.mutateAsync(id);
      toast.success('재생목록이 삭제되었습니다');
      router.push('/library');
    } catch {
      toast.error('삭제에 실패했습니다');
    }
  };

  const handleDuplicate = async () => {
    if (!id) {return;}
    try {
      const result = await duplicatePlaylist.mutateAsync(id);
      toast.success('재생목록이 복제되었습니다');
      router.push(`/playlist/${result.id}`);
    } catch {
      toast.error('복제에 실패했습니다');
    }
  };

  const toggleTrackSelection = useCallback((videoId: string) => {
    setSelectedVideoIds((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedVideoIds.size === displayedTracks.length) {
      setSelectedVideoIds(new Set());
    } else {
      setSelectedVideoIds(new Set(displayedTracks.map((t) => t.videoId)));
    }
  }, [selectedVideoIds.size, displayedTracks]);

  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
    setSelectedVideoIds(new Set());
  }, []);

  const handleBatchRemove = async () => {
    if (!id || selectedVideoIds.size === 0) {return;}
    try {
      const results = await Promise.allSettled(
        [...selectedVideoIds].map((videoId) =>
          removeTrack.mutateAsync({ playlistId: id, videoId }),
        ),
      );
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.filter((r) => r.status === 'rejected').length;
      if (failCount > 0) {
        toast.success(`${successCount}곡 제거 (${failCount}곡 실패)`);
      } else {
        toast.success(`${successCount}곡을 제거했습니다`);
      }
      setSelectedVideoIds(new Set());
    } catch {
      toast.error('제거에 실패했습니다');
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 pt-6">
        <Skeleton className="w-full aspect-square max-w-[200px] mx-auto rounded-xl mb-4" />
        <Skeleton className="h-6 w-3/4 mx-auto rounded mb-2" />
        <Skeleton className="h-4 w-1/2 mx-auto rounded mb-6" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 rounded mb-2" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="px-4 pt-6 text-center text-muted">
        <p>재생목록을 찾을 수 없습니다</p>
      </div>
    );
  }

  const totalDurationText = formatTotalDuration(playlist.tracks?.reduce((sum, t) => sum + t.duration, 0) ?? 0);

  const canDrag = !isEditMode && sortBy === 'default' && !searchQuery.trim() && !playlist.isSystem && !playlist.rules && (playlist.tracks?.length ?? 0) > 1;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {return;}

    const oldIndex = displayedTracks.findIndex((t) => t.videoId === active.id);
    const newIndex = displayedTracks.findIndex((t) => t.videoId === over.id);
    if (oldIndex === -1 || newIndex === -1) {return;}

    const reordered = arrayMove(displayedTracks, oldIndex, newIndex);
    const trackIds = reordered.map((t) => t.id);

    reorderTracks.mutate(trackIds, {
      onError: () => { toast.error('순서 변경에 실패했습니다'); },
    });
  }, [displayedTracks, reorderTracks]);

  const selectedTracks = displayedTracks.filter((t) => selectedVideoIds.has(t.videoId));

  return (
    <div className="pt-6 pb-4">
      <div className="flex items-center justify-between px-4 mb-4">
        <button onClick={() => { router.back(); }} className="p-2 -ml-2 rounded-full active:bg-white/5">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 -mr-2 rounded-full active:bg-white/5">
            <MoreVertical size={20} className="text-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface-elevated border-border">
            <DropdownMenuItem onClick={() => { handleDuplicate().catch(() => undefined); }} disabled={duplicatePlaylist.isPending}>
              <Copy size={16} className="mr-2" />
              {duplicatePlaylist.isPending ? '복제 중...' : '복제'}
            </DropdownMenuItem>
            {!playlist.isSystem && (
              <DropdownMenuItem onClick={() => { setShareOpen(true); }}>
                <Share2 size={16} className="mr-2" />
                공유
              </DropdownMenuItem>
            )}
            {!playlist.isSystem && (
              <DropdownMenuItem onClick={() => { setMoveFolderOpen(true); }}>
                <FolderInput size={16} className="mr-2" />
                폴더로 이동
              </DropdownMenuItem>
            )}
            {!playlist.isSystem && (
              <DropdownMenuItem onClick={() => { setSmartOpen(true); }}>
                <Zap size={16} className="mr-2" />
                스마트 재생목록
              </DropdownMenuItem>
            )}
            {!playlist.isSystem && (
              <DropdownMenuItem onClick={() => { setEditOpen(true); }}>
                <Pencil size={16} className="mr-2" />
                정보 편집
              </DropdownMenuItem>
            )}
            {!playlist.isSystem && (
              <DropdownMenuItem onClick={() => { handleDelete().catch(() => undefined); }} disabled={deletePlaylist.isPending} className="text-destructive">
                {deletePlaylist.isPending ? '삭제 중...' : '재생목록 삭제'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-center px-4 mb-6">
        <div className="w-48 h-48 mx-auto rounded-xl bg-surface flex items-center justify-center mb-4 overflow-hidden">
          {playlist.coverImage ? (
            <Image src={playlist.coverImage} alt={playlist.name} className="w-full h-full object-cover" unoptimized width={192} height={192} />
          ) : (
            <div className="grid grid-cols-2 gap-0.5 w-full h-full">
              {playlist.tracks?.slice(0, 4).map((t) => (
                <div key={t.videoId} className="bg-surface-elevated overflow-hidden">
                  {t.thumbnail && <Image src={t.thumbnail} alt="" className="w-full h-full object-cover" unoptimized width={96} height={96} />}
                </div>
              ))}
              {(!playlist.tracks || playlist.tracks.length < 4) &&
                Array.from({ length: Math.max(0, 4 - (playlist.tracks?.length ?? 0)) }).map((_, i) => (
                  <div key={i} className="bg-surface-elevated" />
                ))}
            </div>
          )}
        </div>
        <h1 className="text-xl font-bold text-foreground">{playlist.name}</h1>
        {playlist.description && <p className="text-sm text-muted mt-1">{playlist.description}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          {playlist.trackCount}곡{totalDurationText ? ` · ${totalDurationText}` : ''}
          {playlist.rules && <span className="ml-2 text-amber-400">스마트</span>}
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 px-4 mb-4">
        <button
          onClick={handleShuffle}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 text-sm text-foreground active:bg-white/10"
        >
          <Shuffle size={16} />
          셔플
        </button>
        <button
          onClick={() => { handlePlay(0); }}
          disabled={!playlist.tracks?.length}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium active:scale-95 transition-transform disabled:opacity-40"
        >
          <Play size={16} fill="currentColor" />
          재생
        </button>
      </div>

      {(playlist.tracks?.length ?? 0) > 0 && (
        <div className="flex items-center gap-2 px-4 mb-3">
          {isEditMode ? (
            <>
              <button onClick={toggleSelectAll} className="text-sm text-muted px-2 py-2 rounded-xl active:bg-white/5">
                {selectedVideoIds.size === displayedTracks.length ? '전체 해제' : '전체 선택'}
              </button>
              <span className="flex-1 text-center text-xs text-muted-foreground">
                {selectedVideoIds.size}곡 선택됨
              </span>
              <button onClick={exitEditMode} className="text-sm text-foreground px-2 py-2 rounded-xl active:bg-white/5 font-medium">
                완료
              </button>
            </>
          ) : searchOpen ? (
            <>
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  autoFocus
                  type="search"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); }}
                  placeholder="트랙 검색"
                  className="w-full bg-white/5 rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                className="p-2 rounded-full active:bg-white/5 text-muted"
              >
                <X size={18} />
              </button>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 text-sm text-muted active:bg-white/10">
                  <ArrowUpDown size={14} />
                  {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-surface-elevated border-border">
                  {SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => { setSortBy(option.value); }}
                      className={sortBy === option.value ? 'font-medium text-foreground' : ''}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex-1" />
              <button
                onClick={() => { setSearchOpen(true); }}
                className="p-2 rounded-full active:bg-white/5 text-muted"
              >
                <Search size={18} />
              </button>
              {!playlist.isSystem && (
                <button
                  onClick={() => { setIsEditMode(true); }}
                  className="text-sm text-muted px-3 py-2 rounded-xl active:bg-white/5"
                >
                  편집
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div className="space-y-0.5 px-2">
        {displayedTracks.length > 0 ? (
          isEditMode ? (
            displayedTracks.map((track) => (
              <CheckboxTrackItem
                key={track.videoId}
                videoId={track.videoId}
                title={track.title}
                channel={track.channel}
                thumbnail={track.thumbnail}
                duration={track.duration}
                selected={selectedVideoIds.has(track.videoId)}
                onToggle={toggleTrackSelection}
              />
            ))
          ) : canDrag ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={displayedTracks.map((t) => t.videoId)} strategy={verticalListSortingStrategy}>
                {displayedTracks.map((track, i) => (
                  <SortableTrackItem
                    key={track.videoId}
                    id={track.videoId}
                    title={track.title}
                    channel={track.channel}
                    thumbnail={track.thumbnail}
                    duration={track.duration}
                    onClick={() => { handlePlay(i); }}
                    onMore={() => {
                      openContext({
                         id: track.videoId,
                        title: track.title,
                        channel: track.channel,
                        thumbnail: track.thumbnail,
                        duration: track.duration,
                      });
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            displayedTracks.map((track, i) => (
              <TrackItem
                key={track.videoId}
                id={track.videoId}
                title={track.title}
                channel={track.channel}
                thumbnail={track.thumbnail}
                duration={track.duration}
                onClick={() => { handlePlay(i); }}
                onMore={() => {
                  openContext({
                     id: track.videoId,
                    title: track.title,
                    channel: track.channel,
                    thumbnail: track.thumbnail,
                    duration: track.duration,
                  });
                }}
              />
            ))
          )
        ) : searchQuery ? (
          <div className="text-center py-16 text-muted">
            <p className="text-sm">검색 결과가 없습니다</p>
          </div>
        ) : null}
      </div>

      {isEditMode && selectedVideoIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-elevated border-t border-border p-4 flex gap-3">
          <button
            onClick={() => { setBatchSheetOpen(true); }}
            className="flex-1 py-3 rounded-xl bg-white/5 text-sm text-foreground font-medium active:bg-white/10"
          >
            재생목록에 추가
          </button>
          <button
            onClick={() => { handleBatchRemove().catch(() => undefined); }}
            className="flex-1 py-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium active:bg-destructive/20"
          >
            제거 ({selectedVideoIds.size})
          </button>
        </div>
      )}

      <TrackContextMenu
        open={contextOpen}
        onOpenChange={setContextOpen}
        track={contextTrack}
        onAddToQueue={addToQueue}
        onPlayNext={playNext}
        onOpenInYoutube={openInYoutube}
        onRemoveFromPlaylist={handleRemoveFromPlaylist}
      />

      {!playlist.isSystem && (
        <EditPlaylistDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          playlist={playlist}
        />
      )}

      {!playlist.isSystem && (
        <SmartPlaylistDialog
          open={smartOpen}
          onOpenChange={setSmartOpen}
          playlist={playlist}
        />
      )}

      {!playlist.isSystem && (
        <SharePlaylistDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          playlist={playlist}
        />
      )}

      {!playlist.isSystem && (
        <MoveToFolderSheet
          open={moveFolderOpen}
          onOpenChange={setMoveFolderOpen}
          playlistId={playlist.id}
        />
      )}

      <AddToPlaylistSheet
        open={batchSheetOpen}
        onOpenChange={setBatchSheetOpen}
        track={null}
        tracks={selectedTracks.map((t) => ({
          videoId: t.videoId,
          title: t.title,
          channel: t.channel,
          thumbnail: t.thumbnail,
          duration: t.duration,
        }))}
      />
    </div>
  );
}
