import type { IPlaylistRepository, IFolderRepository } from '@/server/domain/ports/repositories';
import type { Playlist, PlaylistTrack, PlaylistFolder, SmartPlaylistRules } from '@/types';

export function createGetPlaylists(repo: IPlaylistRepository) {
  return (userId: string): Promise<Playlist[]> => repo.getAll(userId);
}

export function createGetPlaylist(repo: IPlaylistRepository) {
  return (userId: string, id: string): Promise<Playlist | null> => repo.getById(userId, id);
}

export function createGetOrCreateLikedPlaylist(repo: IPlaylistRepository) {
  return (userId: string): Promise<Playlist> => repo.getOrCreateLiked(userId);
}

export function createCreatePlaylist(repo: IPlaylistRepository) {
  return (userId: string, name: string, description?: string): Promise<Playlist> =>
    repo.create(userId, name, description);
}

export function createUpdatePlaylist(repo: IPlaylistRepository) {
  return (userId: string, id: string, data: Parameters<IPlaylistRepository['update']>[2]): Promise<Playlist | null> =>
    repo.update(userId, id, data);
}

export function createDeletePlaylist(repo: IPlaylistRepository) {
  return (userId: string, id: string): Promise<boolean> => repo.delete(userId, id);
}

export function createAddTrack(repo: IPlaylistRepository) {
  return (userId: string, playlistId: string, track: { videoId: string; title: string; channel: string; thumbnail: string; duration: number }): Promise<PlaylistTrack | null> =>
    repo.addTrack(userId, playlistId, track);
}

export function createRemoveTrack(repo: IPlaylistRepository) {
  return (userId: string, playlistId: string, videoId: string): Promise<boolean> =>
    repo.removeTrack(userId, playlistId, videoId);
}

export function createReorderTracks(repo: IPlaylistRepository) {
  return (userId: string, playlistId: string, trackIds: number[]): Promise<boolean> =>
    repo.reorderTracks(userId, playlistId, trackIds);
}

export function createDuplicatePlaylist(repo: IPlaylistRepository) {
  return (userId: string, sourceId: string): Promise<Playlist | null> =>
    repo.duplicate(userId, sourceId);
}

export function createGetSharedPlaylist(repo: IPlaylistRepository) {
  return (shareId: string): Promise<Playlist | null> => repo.getShared(shareId);
}

export function createGetSmartPlaylistTracks(repo: IPlaylistRepository) {
  return (userId: string, rules: SmartPlaylistRules): Promise<PlaylistTrack[]> =>
    repo.getSmartPlaylistTracks(userId, rules);
}

export function createGetFolders(folderRepo: IFolderRepository) {
  return (userId: string): Promise<PlaylistFolder[]> => folderRepo.getAll(userId);
}

export function createCreateFolder(folderRepo: IFolderRepository) {
  return (userId: string, name: string): Promise<PlaylistFolder> => folderRepo.create(userId, name);
}

export function createUpdateFolder(folderRepo: IFolderRepository) {
  return (userId: string, id: string, data: { name?: string; sortOrder?: number }): Promise<PlaylistFolder | null> =>
    folderRepo.update(userId, id, data);
}

export function createDeleteFolder(folderRepo: IFolderRepository) {
  return (userId: string, id: string): Promise<boolean> => folderRepo.delete(userId, id);
}

export function createMovePlaylistToFolder(folderRepo: IFolderRepository) {
  return (userId: string, playlistId: string, folderId: string | null): Promise<boolean> =>
    folderRepo.movePlaylist(userId, playlistId, folderId);
}
