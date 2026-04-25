import { useState } from 'react';
import { Plus, ListMusic, Loader2 } from 'lucide-react';
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

interface AddToPlaylistSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: {
    video_id: string;
    title: string;
    channel: string;
    thumbnail: string;
    duration: number;
  } | null;
}

export function AddToPlaylistSheet({ open, onOpenChange, track }: AddToPlaylistSheetProps) {
  const { data: playlists = [], isLoading: playlistsLoading } = usePlaylists();
  const createPlaylist = useCreatePlaylist();
  const addTrack = useAddTrackToPlaylist();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const playlist = await createPlaylist.mutateAsync({ name: newName.trim() });
      if (track) {
        await addTrack.mutateAsync({ playlistId: playlist.id, track });
        toast.success(`"${newName.trim()}"에 추가했습니다`);
      }
      setNewName('');
      setIsCreating(false);
      onOpenChange(false);
    } catch {
      toast.error('재생목록 생성에 실패했습니다');
    }
  };

  const handleAdd = async (playlistId: string) => {
    if (!track) return;
    try {
      await addTrack.mutateAsync({ playlistId, track });
      toast.success('재생목록에 추가했습니다');
      onOpenChange(false);
    } catch {
      toast.error('추가에 실패했습니다');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="bg-surface-elevated border-border rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>재생목록에 추가</SheetTitle>
          <SheetDescription />
        </SheetHeader>

        <div className="py-2">
          {isCreating ? (
            <div className="flex items-center gap-2 px-2 py-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="재생목록 이름"
                className="flex-1 bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || createPlaylist.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-40"
              >
                {createPlaylist.isPending ? '생성 중...' : '만들기'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
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
                  <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 rounded mb-2" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => handleAdd(pl.id)}
                disabled={addTrack.isPending}
                className="w-full flex items-center gap-4 px-2 py-3 rounded-xl active:bg-white/5 disabled:opacity-40"
              >
                <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
                  <ListMusic size={20} className="text-muted" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm text-foreground truncate">{pl.name}</p>
                  <p className="text-xs text-muted">{pl.track_count}곡</p>
                </div>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
