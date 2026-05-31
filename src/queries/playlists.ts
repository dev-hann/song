import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { STALE_TIME } from './options';
import {
  fetchPlaylists, fetchPlaylist, createPlaylist, updatePlaylist, deletePlaylist,
  addTrackToPlaylist, removeTrackFromPlaylist, reorderPlaylistTracks, duplicatePlaylist,
  fetchSmartPlaylistTracks, sharePlaylist, fetchFolders, createFolder, updateFolder,
  deleteFolder, movePlaylistToFolder,
} from '@/services/api';

export function usePlaylists() {
  return useQuery({
    queryKey: queryKeys.playlists.all(),
    queryFn: fetchPlaylists,
    staleTime: STALE_TIME.PLAYLISTS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function usePlaylist(id: string) {
  return useQuery({
    queryKey: queryKeys.playlists.detail(id),
    queryFn: () => fetchPlaylist(id),
    enabled: !!id,
    staleTime: STALE_TIME.PLAYLISTS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useSmartPlaylistTracks(id: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.playlists.smartTracks(id),
    queryFn: () => fetchSmartPlaylistTracks(id),
    enabled: enabled && !!id,
    staleTime: STALE_TIME.PLAYLISTS,
    refetchOnWindowFocus: false,
    retry: 1,
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

export function useUpdatePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePlaylist>[1] }) =>
      updatePlaylist(id, data),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: queryKeys.playlists.all() });
      await qc.invalidateQueries({ queryKey: queryKeys.playlists.detail(vars.id) });
    },
  });
}

export function useSharePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      sharePlaylist(id, isPublic),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: queryKeys.playlists.detail(vars.id) });
      await qc.invalidateQueries({ queryKey: queryKeys.playlists.all() });
    },
  });
}

export function useFolders() {
  return useQuery({
    queryKey: queryKeys.folders.all(),
    queryFn: fetchFolders,
    staleTime: STALE_TIME.PLAYLISTS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createFolder,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.folders.all() }),
  });
}

export function useUpdateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateFolder>[1] }) =>
      updateFolder(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.folders.all() }),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.folders.all() });
      qc.invalidateQueries({ queryKey: queryKeys.playlists.all() });
    },
  });
}

export function useMovePlaylistToFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, folderId }: { playlistId: string; folderId: string | null }) =>
      movePlaylistToFolder(playlistId, folderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.playlists.all() });
      qc.invalidateQueries({ queryKey: queryKeys.folders.all() });
    },
  });
}

export function useAddTrackToPlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, track }: { playlistId: string; track: Parameters<typeof addTrackToPlaylist>[1] }) =>
      addTrackToPlaylist(playlistId, track),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.playlists.all() });
      await qc.invalidateQueries({ queryKey: ['song', 'playlists'] });
    },
  });
}

export function useRemoveTrackFromPlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, videoId }: { playlistId: string; videoId: string }) =>
      removeTrackFromPlaylist(playlistId, videoId),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: queryKeys.playlists.all() });
      await qc.invalidateQueries({ queryKey: queryKeys.playlists.detail(vars.playlistId) });
    },
  });
}

export function useReorderPlaylistTracks(playlistId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (trackIds: number[]) =>
      reorderPlaylistTracks(playlistId, trackIds),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.playlists.all() });
      await qc.invalidateQueries({ queryKey: queryKeys.playlists.detail(playlistId) });
    },
  });
}

export function useDuplicatePlaylist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: duplicatePlaylist,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.playlists.all() }),
  });
}
