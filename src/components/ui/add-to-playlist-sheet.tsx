import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { usePlaylists, useCreatePlaylist, useAddTrackToPlaylist } from '@/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';

interface AddToPlaylistSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: {
    videoId: string;
    title: string;
    channel: string;
    thumbnail: string;
    duration: number;
  } | null;
  tracks?: {
    videoId: string;
    title: string;
    channel: string;
    thumbnail: string;
    duration: number;
  }[];
}

export function AddToPlaylistSheet({ open, onOpenChange, track, tracks }: AddToPlaylistSheetProps) {
  const { data: playlists = [], isLoading: playlistsLoading } = usePlaylists();
  const createPlaylist = useCreatePlaylist();
  const addTrackMutation = useAddTrackToPlaylist();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirming, setIsConfirming] = useState(false);

  const toggleSelection = (playlistId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(playlistId)) {
        next.delete(playlistId);
      } else {
        next.add(playlistId);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) {return;}
    const tracksToAdd = tracks ?? (track ? [track] : []);
    if (tracksToAdd.length === 0) {return;}
    setIsConfirming(true);
    try {
      const promises = [...selectedIds].flatMap((playlistId) =>
        tracksToAdd.map((t) =>
          addTrackMutation.mutateAsync({ playlistId, track: t }),
        ),
      );
      const results = await Promise.allSettled(promises);

      let successCount = 0;
      let duplicateCount = 0;

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          if (result.reason instanceof ApiError && result.reason.status === 409) {
            duplicateCount++;
          }
        }
      });

      if (successCount > 0 && duplicateCount > 0) {
        toast.success(`${successCount}곡 추가 (${duplicateCount}곡은 이미 있음)`);
      } else if (successCount > 0) {
        toast.success(`${successCount}곡을 재생목록에 추가했습니다`);
      } else if (duplicateCount > 0) {
        toast.error('이미 모든 재생목록에 있는 곡입니다');
      }

      setSelectedIds(new Set());
      onOpenChange(false);
    } catch {
      toast.error('추가에 실패했습니다');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {return;}
    try {
      const playlist = await createPlaylist.mutateAsync({ name: newName.trim() });
      setSelectedIds((prev) => new Set([...prev, playlist.id]));
      setNewName('');
      setIsCreating(false);
    } catch {
      toast.error('재생목록 생성에 실패했습니다');
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => {
      if (!o) {
        setSelectedIds(new Set());
        setIsCreating(false);
        setNewName('');
      }
      onOpenChange(o);
    }}>
      <SheetContent side="bottom" showCloseButton={false} className="bg-surface-elevated border-border rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>재생목록에 추가</SheetTitle>
          <SheetDescription />
        </SheetHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          <div className="py-2">
            {isCreating ? (
              <div className="flex items-center gap-2 px-2 py-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { handleCreate().catch(() => undefined); }
                  }}
                  placeholder="재생목록 이름"
                  className="flex-1 bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={() => { handleCreate().catch(() => undefined); }}
                  disabled={!newName.trim() || createPlaylist.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-40"
                >
                  {createPlaylist.isPending ? '생성 중...' : '만들기'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setIsCreating(true); }}
                className="w-full flex items-center gap-4 px-2 py-3 rounded-xl active:bg-white/5"
              >
                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                  <Plus size={20} className="text-muted" />
                </div>
                <span className="text-sm text-foreground">새 재생목록 만들기</span>
              </button>
            )}

            {playlistsLoading ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-2 py-3">
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 rounded mb-2" />
                      <Skeleton className="h-3 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              playlists.map((pl) => {
                const isSelected = selectedIds.has(pl.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() => { toggleSelection(pl.id); }}
                    className="w-full flex items-center gap-4 px-2 py-3 rounded-xl active:bg-white/5"
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                      {isSelected && <Check size={14} className="text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm text-foreground truncate">{pl.name}</p>
                      <p className="text-xs text-muted">{pl.trackCount}곡</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="pt-2 border-t border-border">
            <button
              onClick={() => { handleConfirm().catch(() => undefined); }}
              disabled={isConfirming}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-40"
            >
              {isConfirming ? '추가 중...' : `추가 (${selectedIds.size})`}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
