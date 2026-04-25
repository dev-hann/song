import type { Playlist, CreatePlaylistRequest, AddTrackRequest } from '@/types';
import { apiFetch } from '@/lib/api-client';

export async function fetchPlaylists(): Promise<Playlist[]> {
  const res = await apiFetch('/api/playlists');
  if (!res.ok) throw new Error('Failed to fetch playlists');
  return res.json();
}

export async function fetchPlaylist(id: string): Promise<Playlist> {
  const res = await apiFetch(`/api/playlists/${id}`);
  if (!res.ok) throw new Error('Failed to fetch playlist');
  return res.json();
}

export async function createPlaylist(data: CreatePlaylistRequest): Promise<Playlist> {
  const res = await apiFetch('/api/playlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create playlist');
  return res.json();
}

export async function updatePlaylist(
  id: string,
  data: Partial<Pick<Playlist, 'name' | 'description'>>,
): Promise<Playlist> {
  const res = await apiFetch(`/api/playlists/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update playlist');
  return res.json();
}

export async function deletePlaylist(id: string): Promise<void> {
  const res = await apiFetch(`/api/playlists/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete playlist');
}

export async function addTrackToPlaylist(
  playlistId: string,
  track: AddTrackRequest,
): Promise<void> {
  const res = await apiFetch(`/api/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(track),
  });
  if (!res.ok) throw new Error('Failed to add track');
}

export async function removeTrackFromPlaylist(
  playlistId: string,
  videoId: string,
): Promise<void> {
  const res = await apiFetch(`/api/playlists/${playlistId}/tracks/${videoId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove track');
}

export async function reorderPlaylistTracks(
  playlistId: string,
  trackIds: number[],
): Promise<Playlist> {
  const res = await apiFetch(`/api/playlists/${playlistId}/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackIds }),
  });
  if (!res.ok) throw new Error('Failed to reorder tracks');
  return res.json();
}
