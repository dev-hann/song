'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFolders, useCreateFolder, useMovePlaylistToFolder } from '@/queries';
import { toast } from 'sonner';
import { FolderOpen, Plus } from 'lucide-react';

interface MoveToFolderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistId: string;
}

export function MoveToFolderSheet({ open, onOpenChange, playlistId }: MoveToFolderSheetProps) {
  const { data: folders } = useFolders();
  const movePlaylist = useMovePlaylistToFolder();
  const createFolder = useCreateFolder();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleMove = async (folderId: string | null) => {
    try {
      await movePlaylist.mutateAsync({ playlistId, folderId });
      toast.success(folderId ? '폴더로 이동했습니다' : '폴더에서 제거했습니다');
      onOpenChange(false);
    } catch {
      toast.error('이동에 실패했습니다');
    }
  };

  const handleCreateFolder = async () => {
    if (!newName.trim()) {return;}
    try {
      const folder = await createFolder.mutateAsync(newName.trim());
      setNewName('');
      setIsCreating(false);
      await handleMove(folder.id);
    } catch {
      toast.error('폴더 생성에 실패했습니다');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>폴더로 이동</DialogTitle>
        </DialogHeader>

        <div className="space-y-1">
          <button
            onClick={() => { handleMove(null).catch(() => undefined); }}
            className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-white/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
              <FolderOpen size={18} className="text-muted" />
            </div>
            <span className="text-sm text-foreground">폴더 없음</span>
          </button>

          {folders?.map((folder) => (
            <button
              key={folder.id}
              onClick={() => { handleMove(folder.id).catch(() => undefined); }}
              className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-white/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
                <FolderOpen size={18} className="text-amber-400" />
              </div>
              <span className="text-sm text-foreground">{folder.name}</span>
            </button>
          ))}
        </div>

        {isCreating ? (
          <div className="flex items-center gap-2 pt-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => { setNewName(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {handleCreateFolder().catch(() => undefined);}
              }}
              placeholder="폴더 이름"
              className="flex-1 bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button
              onClick={() => { handleCreateFolder().catch(() => undefined); }}
              disabled={!newName.trim() || createFolder.isPending}
              size="sm"
            >
              만들기
            </Button>
          </div>
        ) : (
          <button
            onClick={() => { setIsCreating(true); }}
            className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-white/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
              <Plus size={18} className="text-muted" />
            </div>
            <span className="text-sm text-muted-foreground">새 폴더 만들기</span>
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
