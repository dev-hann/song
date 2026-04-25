import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { fetchPlaylists, fetchPlaylist, createPlaylist, deletePlaylist, addTrackToPlaylist, removeTrackFromPlaylist } from '@/services/api';

export function usePlaylists() {
  return useQuery({
    queryKey: queryKeys.playlists.all(),
    queryFn: fetchPlaylists,
    staleTime: 30 * 1000,
  });
}

export function usePlaylist(id: string) {
  return useQuery({
    queryKey: queryKeys.playlists.detail(id),
    queryFn: () => fetchPlaylist(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreatePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPlaylist,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.playlists.all() }),
  });
}

export function useDeletePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePlaylist,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.playlists.all() }),
  });
}

export function useAddTrackToPlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, track }: { playlistId: string; track: Parameters<typeof addTrackToPlaylist>[1] }) =>
      addTrackToPlaylist(playlistId, track),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.playlists.all() });
      qc.invalidateQueries({ queryKey: ['song', 'playlists'] });
    },
  });
}

export function useRemoveTrackFromPlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, videoId }: { playlistId: string; videoId: string }) =>
      removeTrackFromPlaylist(playlistId, videoId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.playlists.all() });
      qc.invalidateQueries({ queryKey: queryKeys.playlists.detail(vars.playlistId) });
    },
  });
}
