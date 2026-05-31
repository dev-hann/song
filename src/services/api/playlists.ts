import type { Playlist, CreatePlaylistRequest, AddTrackRequest, PlaylistFolder, PlaylistTrack } from '@/types';
import { apiFetch } from '@/lib/api-client';

export async function fetchPlaylists(): Promise<Playlist[]> {
  return apiFetch<Playlist[]>('/api/playlists');
}

export async function fetchPlaylist(id: string): Promise<Playlist> {
  return apiFetch<Playlist>(`/api/playlists/${id}`);
}

export async function createPlaylist(data: CreatePlaylistRequest): Promise<Playlist> {
  return apiFetch<Playlist>('/api/playlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updatePlaylist(
  id: string,
  data: Partial<Pick<Playlist, 'name' | 'description' | 'coverImage' | 'rules' | 'folderId' | 'isPublic'>>,
): Promise<Playlist> {
  return apiFetch<Playlist>(`/api/playlists/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletePlaylist(id: string): Promise<void> {
  await apiFetch(`/api/playlists/${id}`, { method: 'DELETE' });
}

export async function addTrackToPlaylist(
  playlistId: string,
  track: AddTrackRequest,
): Promise<void> {
  await apiFetch(`/api/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(track),
  });
}

export async function removeTrackFromPlaylist(
  playlistId: string,
  videoId: string,
): Promise<void> {
  await apiFetch(`/api/playlists/${playlistId}/tracks?videoId=${encodeURIComponent(videoId)}`, {
    method: 'DELETE',
  });
}

export async function reorderPlaylistTracks(
  playlistId: string,
  trackIds: number[],
): Promise<Playlist> {
  return apiFetch<Playlist>(`/api/playlists/${playlistId}/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackIds }),
  });
}

export async function duplicatePlaylist(id: string): Promise<Playlist> {
  return apiFetch<Playlist>(`/api/playlists/${id}/duplicate`, {
    method: 'POST',
  });
}

export async function fetchSmartPlaylistTracks(playlistId: string): Promise<PlaylistTrack[]> {
  return apiFetch<PlaylistTrack[]>(`/api/playlists/${playlistId}/smart-tracks`);
}

export async function sharePlaylist(
  id: string,
  isPublic: boolean,
): Promise<{ isPublic: boolean; shareId: string | null }> {
  return apiFetch<{ isPublic: boolean; shareId: string | null }>(`/api/playlists/${id}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isPublic }),
  });
}

export async function fetchSharedPlaylist(shareId: string): Promise<Playlist> {
  return apiFetch<Playlist>(`/api/shared/${shareId}`);
}

export async function fetchFolders(): Promise<PlaylistFolder[]> {
  return apiFetch<PlaylistFolder[]>('/api/folders');
}

export async function createFolder(name: string): Promise<PlaylistFolder> {
  return apiFetch<PlaylistFolder>('/api/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function updateFolder(
  id: string,
  data: { name?: string; sortOrder?: number },
): Promise<PlaylistFolder> {
  return apiFetch<PlaylistFolder>(`/api/folders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteFolder(id: string): Promise<void> {
  await apiFetch(`/api/folders/${id}`, { method: 'DELETE' });
}

export async function movePlaylistToFolder(
  playlistId: string,
  folderId: string | null,
): Promise<void> {
  await apiFetch(`/api/playlists/${playlistId}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderId }),
  });
}
