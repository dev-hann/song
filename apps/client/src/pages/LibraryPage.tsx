import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ListMusic, Clock, Plus, Settings } from 'lucide-react';
import { usePlaylists, useLikes, useHistory, useCreatePlaylist } from '@/queries';
import { ContentCard } from '@/components/ui/content-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const filters = ['재생목록', '좋아요', '최근 재생'] as const;
type Filter = (typeof filters)[number];

export default function LibraryPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<Filter>('재생목록');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const { data: playlists, isLoading: playlistsLoading } = usePlaylists();
  const { data: likes } = useLikes();
  const { data: history } = useHistory(6);
  const createPlaylist = useCreatePlaylist();

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createPlaylist.mutateAsync({ name: newName.trim() });
      toast.success(`"${newName.trim()}" 재생목록이 생성되었습니다`);
      setNewName('');
      setIsCreating(false);
    } catch {
      toast.error('재생목록 생성에 실패했습니다');
    }
  };

  return (
    <div className="pt-6 pb-4">
      <div className="px-4 flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">라이브러리</h1>
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-full active:bg-white/5"
        >
          <Settings size={20} className="text-muted" />
        </button>
      </div>

      <div className="px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors',
                activeFilter === filter
                  ? 'bg-white/15 text-foreground'
                  : 'bg-white/5 text-muted active:bg-white/10',
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
              onClick={() => navigate('/liked')}
              className="w-full flex items-center gap-4 p-3 rounded-xl active:bg-white/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600/60 to-blue-600/40 flex items-center justify-center flex-shrink-0">
                <Heart size={20} className="text-white fill-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground">좋아요한 곡</p>
                <p className="text-xs text-muted">{likes?.length || 0}곡</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/recent')}
              className="w-full flex items-center gap-4 p-3 rounded-xl active:bg-white/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600/60 to-emerald-600/40 flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground">최근 재생</p>
                <p className="text-xs text-muted">{history?.length || 0}곡</p>
              </div>
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-muted">재생목록</h2>
              {isCreating ? (
                <button
                  onClick={() => { setIsCreating(false); setNewName(''); }}
                  className="text-sm text-muted-foreground"
                >
                  취소
                </button>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-1 text-sm text-muted-foreground active:text-foreground"
                >
                  <Plus size={16} />
                  만들기
                </button>
              )}
            </div>

            {isCreating && (
              <div className="flex items-center gap-2 mb-3">
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
                {playlists
                  ?.filter((p) => !p.is_system)
                  .map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => navigate(`/playlist/${playlist.id}`)}
                      className="w-full flex items-center gap-4 p-3 rounded-xl active:bg-white/5 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                        <ListMusic size={20} className="text-muted" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-foreground truncate">{playlist.name}</p>
                        <p className="text-xs text-muted">{playlist.track_count}곡</p>
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
            onClick={() => navigate('/liked')}
            className="w-full flex items-center gap-4 p-3 rounded-xl active:bg-white/5 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600/60 to-blue-600/40 flex items-center justify-center flex-shrink-0">
              <Heart size={20} className="text-white fill-white" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-foreground">좋아요한 곡</p>
              <p className="text-xs text-muted">{likes?.length || 0}곡</p>
            </div>
          </button>
        </div>
      )}

      {activeFilter === '최근 재생' && (
        <div className="px-4">
          <button
            onClick={() => navigate('/recent')}
            className="w-full flex items-center gap-4 p-3 rounded-xl active:bg-white/5 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600/60 to-emerald-600/40 flex items-center justify-center flex-shrink-0">
              <Clock size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-foreground">최근 재생</p>
              <p className="text-xs text-muted">{history?.length || 0}곡</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
