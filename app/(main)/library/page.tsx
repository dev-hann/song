'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ListMusic, Clock, Plus, Settings, FolderOpen, ChevronRight, Zap } from 'lucide-react';
import { usePlaylists, useLikes, useHistory, useCreatePlaylist, useFolders, useDeleteFolder } from '@/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';

const filters = ['재생목록', '좋아요', '최근 재생'] as const;
type Filter = (typeof filters)[number];

export default function LibraryPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Filter>('재생목록');
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newName, setNewName] = useState('');
  const [folderName, setFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const { data: playlists, isLoading: playlistsLoading } = usePlaylists();
  const { data: likes } = useLikes();
  const { data: history } = useHistory(6);
  const { data: folders } = useFolders();
  const createPlaylist = useCreatePlaylist();
  const deleteFolder = useDeleteFolder();

  const handleCreate = async () => {
    if (!newName.trim()) {return;}
    try {
      await createPlaylist.mutateAsync({ name: newName.trim() });
      toast.success(`"${newName.trim()}" 재생목록이 생성되었습니다`);
      setNewName('');
      setIsCreating(false);
    } catch {
      toast.error('재생목록 생성에 실패했습니다');
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {return;}
    try {
      const { createFolder } = await import('@/services/api');
      await createFolder(folderName.trim());
      toast.success(`"${folderName.trim()}" 폴더가 생성되었습니다`);
      setFolderName('');
      setIsCreatingFolder(false);
    } catch {
      toast.error('폴더 생성에 실패했습니다');
    }
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    try {
      await deleteFolder.mutateAsync(id);
      toast.success(`"${name}" 폴더가 삭제되었습니다`);
    } catch {
      toast.error('폴더 삭제에 실패했습니다');
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {next.delete(folderId);}
      else {next.add(folderId);}
      return next;
    });
  };

  const ungroupedPlaylists = playlists?.filter((p) => !p.isSystem && !p.folderId) ?? [];
  const folderPlaylists = (folderId: string) => playlists?.filter((p) => !p.isSystem && p.folderId === folderId) ?? [];

  return (
    <div className="pt-6 pb-4">
      <div className="px-4 flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">라이브러리</h1>
        <button
          onClick={() => { router.push('/settings'); }}
          className="p-2 rounded-full active:bg-accent"
        >
          <Settings size={20} className="text-muted" />
        </button>
      </div>

      <div className="px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => { setActiveFilter(filter); }}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors',
                activeFilter === filter
                  ? 'bg-secondary text-foreground'
                  : 'bg-accent text-muted active:bg-secondary',
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {activeFilter === '재생목록' && (
        <div className="px-4">
          <div className="space-y-1 mb-4">
            <button
              onClick={() => { router.push('/liked'); }}
              className="w-full flex items-center gap-4 p-3 rounded-xl active:bg-accent transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600/60 to-blue-600/40 flex items-center justify-center flex-shrink-0">
                <Heart size={20} className="text-foreground fill-foreground" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground">좋아요한 곡</p>
                <p className="text-xs text-muted">{likes?.length ?? 0}곡</p>
              </div>
            </button>

            <button
              onClick={() => { router.push('/recent'); }}
              className="w-full flex items-center gap-4 p-3 rounded-xl active:bg-accent transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600/60 to-emerald-600/40 flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-foreground" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground">최근 재생</p>
                <p className="text-xs text-muted">{history?.length ?? 0}곡</p>
              </div>
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-muted">재생목록</h2>
              <div className="flex items-center gap-3">
                {isCreatingFolder ? (
                  <button
                    onClick={() => { setIsCreatingFolder(false); setFolderName(''); }}
                    className="text-sm text-muted-foreground"
                  >
                    취소
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => { setIsCreatingFolder(true); }}
                      className="flex items-center gap-1 text-sm text-muted-foreground active:text-foreground"
                    >
                      <FolderOpen size={14} />
                      폴더
                    </button>
                    {isCreating ? (
                      <button
                        onClick={() => { setIsCreating(false); setNewName(''); }}
                        className="text-sm text-muted-foreground"
                      >
                        취소
                      </button>
                    ) : (
                      <button
                        onClick={() => { setIsCreating(true); }}
                        className="flex items-center gap-1 text-sm text-muted-foreground active:text-foreground"
                      >
                        <Plus size={16} />
                        만들기
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {isCreatingFolder && (
              <div className="flex items-center gap-2 mb-3">
                <input
                  autoFocus
                  value={folderName}
                  onChange={(e) => { setFolderName(e.target.value); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {handleCreateFolder().catch(() => undefined);}
                  }}
                  placeholder="폴더 이름"
                  className="flex-1 bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={() => { handleCreateFolder().catch(() => undefined); }}
                  disabled={!folderName.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-40"
                >
                  만들기
                </button>
              </div>
            )}

            {isCreating && (
              <div className="flex items-center gap-2 mb-3">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {handleCreate().catch(() => undefined);}
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
            )}

            {playlistsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3">
                    <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 rounded mb-2" />
                      <Skeleton className="h-3 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {folders?.map((folder) => (
                  <div key={folder.id}>
                    <button
                      onClick={() => { toggleFolder(folder.id); }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        handleDeleteFolder(folder.id, folder.name).catch(() => undefined);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-accent transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center flex-shrink-0">
                        <FolderOpen size={18} className="text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
                        <p className="text-xs text-muted">{folderPlaylists(folder.id).length}개 재생목록</p>
                      </div>
                      <ChevronRight
                        size={16}
                        className={cn('text-muted transition-transform', expandedFolders.has(folder.id) && 'rotate-90')}
                      />
                    </button>
                    {expandedFolders.has(folder.id) && folderPlaylists(folder.id).map((playlist) => (
                      <button
                        key={playlist.id}
                        onClick={() => { router.push(`/playlist/${playlist.id}`); }}
                         className="w-full flex items-center gap-4 pl-10 pr-3 py-2 rounded-xl active:bg-accent transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {playlist.coverImage ? (
                            <Image src={playlist.coverImage} alt={playlist.name} className="w-full h-full object-cover" unoptimized width={40} height={40} />
                          ) : (
                            <ListMusic size={16} className="text-muted" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-foreground truncate">
                            {playlist.name}
                            {playlist.rules && <Zap size={12} className="inline ml-1 text-amber-400" />}
                          </p>
                          <p className="text-xs text-muted">{playlist.trackCount}곡</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}

                {ungroupedPlaylists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => { router.push(`/playlist/${playlist.id}`); }}
                     className="w-full flex items-center gap-4 p-3 rounded-xl active:bg-accent transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {playlist.coverImage ? (
                        <Image src={playlist.coverImage} alt={playlist.name} className="w-full h-full object-cover" unoptimized width={48} height={48} />
                      ) : (
                        <ListMusic size={20} className="text-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-foreground truncate">
                        {playlist.name}
                        {playlist.rules && <Zap size={12} className="inline ml-1 text-amber-400" />}
                      </p>
                      <p className="text-xs text-muted">{playlist.trackCount}곡</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeFilter === '좋아요' && (
        <div className="px-4">
          <button
            onClick={() => { router.push('/liked'); }}
            className="w-full flex items-center gap-4 p-3 rounded-xl active:bg-accent transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600/60 to-blue-600/40 flex items-center justify-center flex-shrink-0">
              <Heart size={20} className="text-foreground fill-foreground" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-foreground">좋아요한 곡</p>
              <p className="text-xs text-muted">{likes?.length ?? 0}곡</p>
            </div>
          </button>
        </div>
      )}

      {activeFilter === '최근 재생' && (
        <div className="px-4">
          <button
            onClick={() => { router.push('/recent'); }}
            className="w-full flex items-center gap-4 p-3 rounded-xl active:bg-accent transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600/60 to-emerald-600/40 flex items-center justify-center flex-shrink-0">
              <Clock size={20} className="text-foreground" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-foreground">최근 재생</p>
              <p className="text-xs text-muted">{history?.length ?? 0}곡</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
