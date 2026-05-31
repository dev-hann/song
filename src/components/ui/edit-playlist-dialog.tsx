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
import { useUpdatePlaylist } from '@/queries';
import { toast } from 'sonner';
import type { Playlist } from '@/types';

interface EditPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: Playlist;
}

function EditPlaylistForm({ playlist, onOpenChange }: { playlist: Playlist; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description);
  const [coverImage, setCoverImage] = useState(playlist.coverImage);
  const updatePlaylist = useUpdatePlaylist();

  const hasChanges = name.trim() !== playlist.name || description.trim() !== playlist.description || coverImage.trim() !== playlist.coverImage;

  const handleSubmit = async () => {
    if (!name.trim()) {return;}
    try {
      await updatePlaylist.mutateAsync({
        id: playlist.id,
        data: { name: name.trim(), description: description.trim(), coverImage: coverImage.trim() },
      });
      toast.success('재생목록이 수정되었습니다');
      onOpenChange(false);
    } catch {
      toast.error('수정에 실패했습니다');
    }
  };

  return (
    <DialogContent showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>재생목록 편집</DialogTitle>
        <DialogDescription>재생목록의 이름과 설명을 수정합니다</DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">이름</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => { setName(e.target.value); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { handleSubmit().catch(() => undefined); }
            }}
            maxLength={50}
            placeholder="재생목록 이름"
            className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">설명</label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); }}
            maxLength={200}
            placeholder="설명 (선택사항)"
            className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none min-h-[60px]"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">커버 이미지 URL</label>
          <input
            value={coverImage}
            onChange={(e) => { setCoverImage(e.target.value); }}
            maxLength={2000}
            placeholder="이미지 URL (선택사항, 빈 값이면 자동 생성)"
            className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>
          취소
        </DialogClose>
        <Button
          onClick={() => { handleSubmit().catch(() => undefined); }}
          disabled={!name.trim() || !hasChanges || updatePlaylist.isPending}
        >
          {updatePlaylist.isPending ? '저장 중...' : '저장'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function EditPlaylistDialog({ open, onOpenChange, playlist }: EditPlaylistDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <EditPlaylistForm playlist={playlist} onOpenChange={onOpenChange} />
    </Dialog>
  );
}
