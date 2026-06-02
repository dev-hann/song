'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSharePlaylist } from '@/queries';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Playlist } from '@/types';

interface SharePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: Playlist;
}

function SharePlaylistForm({ playlist }: { playlist: Playlist }) {
  const [isPublic, setIsPublic] = useState(playlist.isPublic);
  const sharePlaylist = useSharePlaylist();

  const shareUrl = playlist.shareId ? `${window.location.origin}/shared/${playlist.shareId}` : '';

  const handleToggle = async () => {
    try {
      const result = await sharePlaylist.mutateAsync({ id: playlist.id, isPublic: !isPublic });
      setIsPublic(result.isPublic);
      if (result.isPublic) {
        toast.success('공유가 활성화되었습니다');
      } else {
        toast.success('공유가 비활성화되었습니다');
      }
    } catch {
      toast.error('공유 설정에 실패했습니다');
    }
  };

  const handleCopyLink = () => {
    const url = playlist.shareId ? `${window.location.origin}/shared/${playlist.shareId}` : '';
    if (!url) {return;}
    navigator.clipboard.writeText(url).then(
      () => { toast.success('링크가 복사되었습니다'); },
      () => { toast.error('복사에 실패했습니다'); },
    );
  };

  return (
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>재생목록 공유</DialogTitle>
        <DialogDescription>링크로 재생목록을 공유합니다</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
          <span className="text-sm text-foreground">공개 링크 활성화</span>
          <button
            onClick={() => { handleToggle().catch(() => undefined); }}
            disabled={sharePlaylist.isPending}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors',
              isPublic ? 'bg-foreground' : 'bg-secondary',
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-5 h-5 rounded-full bg-foreground transition-transform',
              isPublic ? 'left-[22px]' : 'left-0.5',
            )} />
          </button>
        </div>

        {isPublic && playlist.shareId && (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">공유 링크</label>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 bg-surface rounded-lg px-3 py-2 text-sm text-foreground truncate"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="flex-shrink-0"
              >
                <Copy size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>
          닫기
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}

export function SharePlaylistDialog({ open, onOpenChange, playlist }: SharePlaylistDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} data-slot="share-playlist-dialog">
      <SharePlaylistForm playlist={playlist} />
    </Dialog>
  );
}
