// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import {
  createGetPlaylists,
  createGetPlaylist,
  createGetOrCreateLikedPlaylist,
  createCreatePlaylist,
  createUpdatePlaylist,
  createDeletePlaylist,
  createAddTrack,
  createRemoveTrack,
  createReorderTracks,
  createDuplicatePlaylist,
  createGetSharedPlaylist,
  createGetSmartPlaylistTracks,
  createGetFolders,
  createCreateFolder,
  createUpdateFolder,
  createDeleteFolder,
  createMovePlaylistToFolder,
} from '../playlists';
import type { Playlist, PlaylistTrack, PlaylistFolder } from '@/types';

function createMockPlaylistRepo() {
  return {
    getAll: vi.fn(),
    getById: vi.fn(),
    getOrCreateLiked: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    reorderTracks: vi.fn(),
    duplicate: vi.fn(),
    getShared: vi.fn(),
    getSmartPlaylistTracks: vi.fn(),
  };
}

function createMockFolderRepo() {
  return {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    movePlaylist: vi.fn(),
  };
}

const mockPlaylist: Playlist = {
  id: 'pl1',
  name: 'My Playlist',
  description: '',
  coverImage: '',
  isSystem: false,
  trackCount: 0,
  rules: null,
  folderId: null,
  isPublic: false,
  shareId: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockTrack: PlaylistTrack = {
  id: 1,
  videoId: 'v1',
  title: 'Song',
  channel: 'Artist',
  thumbnail: '',
  duration: 200,
  sortOrder: 0,
  addedAt: '2024-01-01T00:00:00Z',
};

const mockFolder: PlaylistFolder = {
  id: 'f1',
  name: 'Folder 1',
  sortOrder: 0,
  createdAt: '2024-01-01T00:00:00Z',
};

describe('createGetPlaylists', () => {
  it('returns all playlists for a user', async () => {
    const repo = createMockPlaylistRepo();
    repo.getAll.mockResolvedValue([mockPlaylist]);

    const getPlaylists = createGetPlaylists(repo);
    const result = await getPlaylists('user1');

    expect(result).toEqual([mockPlaylist]);
    expect(repo.getAll).toHaveBeenCalledWith('user1');
  });

  it('returns empty array when no playlists', async () => {
    const repo = createMockPlaylistRepo();
    repo.getAll.mockResolvedValue([]);

    const getPlaylists = createGetPlaylists(repo);
    const result = await getPlaylists('user1');

    expect(result).toEqual([]);
  });

  it('propagates errors from repository', async () => {
    const repo = createMockPlaylistRepo();
    repo.getAll.mockRejectedValue(new Error('DB error'));

    const getPlaylists = createGetPlaylists(repo);
    await expect(getPlaylists('user1')).rejects.toThrow('DB error');
  });
});

describe('createGetPlaylist', () => {
  it('returns a playlist by id', async () => {
    const repo = createMockPlaylistRepo();
    repo.getById.mockResolvedValue(mockPlaylist);

    const getPlaylist = createGetPlaylist(repo);
    const result = await getPlaylist('user1', 'pl1');

    expect(result).toEqual(mockPlaylist);
    expect(repo.getById).toHaveBeenCalledWith('user1', 'pl1');
  });

  it('returns null when playlist not found', async () => {
    const repo = createMockPlaylistRepo();
    repo.getById.mockResolvedValue(null);

    const getPlaylist = createGetPlaylist(repo);
    const result = await getPlaylist('user1', 'nonexistent');

    expect(result).toBeNull();
  });
});

describe('createGetOrCreateLikedPlaylist', () => {
  it('returns the liked playlist', async () => {
    const repo = createMockPlaylistRepo();
    const likedPlaylist = { ...mockPlaylist, isSystem: true };
    repo.getOrCreateLiked.mockResolvedValue(likedPlaylist);

    const getOrCreate = createGetOrCreateLikedPlaylist(repo);
    const result = await getOrCreate('user1');

    expect(result).toEqual(likedPlaylist);
    expect(repo.getOrCreateLiked).toHaveBeenCalledWith('user1');
  });
});

describe('createCreatePlaylist', () => {
  it('creates a playlist', async () => {
    const repo = createMockPlaylistRepo();
    repo.create.mockResolvedValue(mockPlaylist);

    const create = createCreatePlaylist(repo);
    const result = await create('user1', 'My Playlist', 'desc');

    expect(result).toEqual(mockPlaylist);
    expect(repo.create).toHaveBeenCalledWith('user1', 'My Playlist', 'desc');
  });

  it('creates a playlist without description', async () => {
    const repo = createMockPlaylistRepo();
    repo.create.mockResolvedValue(mockPlaylist);

    const create = createCreatePlaylist(repo);
    await create('user1', 'My Playlist');

    expect(repo.create).toHaveBeenCalledWith('user1', 'My Playlist', undefined);
  });
});

describe('createUpdatePlaylist', () => {
  it('updates a playlist', async () => {
    const repo = createMockPlaylistRepo();
    const updated = { ...mockPlaylist, name: 'Updated' };
    repo.update.mockResolvedValue(updated);
    const data = { name: 'Updated' };

    const update = createUpdatePlaylist(repo);
    const result = await update('user1', 'pl1', data);

    expect(result).toEqual(updated);
    expect(repo.update).toHaveBeenCalledWith('user1', 'pl1', data);
  });

  it('returns null when playlist not found', async () => {
    const repo = createMockPlaylistRepo();
    repo.update.mockResolvedValue(null);

    const update = createUpdatePlaylist(repo);
    const result = await update('user1', 'nonexistent', { name: 'X' });

    expect(result).toBeNull();
  });
});

describe('createDeletePlaylist', () => {
  it('deletes a playlist and returns true', async () => {
    const repo = createMockPlaylistRepo();
    repo.delete.mockResolvedValue(true);

    const del = createDeletePlaylist(repo);
    const result = await del('user1', 'pl1');

    expect(result).toBe(true);
    expect(repo.delete).toHaveBeenCalledWith('user1', 'pl1');
  });

  it('returns false when playlist not found', async () => {
    const repo = createMockPlaylistRepo();
    repo.delete.mockResolvedValue(false);

    const del = createDeletePlaylist(repo);
    const result = await del('user1', 'nonexistent');

    expect(result).toBe(false);
  });
});

describe('createAddTrack', () => {
  it('adds a track to a playlist', async () => {
    const repo = createMockPlaylistRepo();
    repo.addTrack.mockResolvedValue(mockTrack);
    const track = { videoId: 'v1', title: 'Song', channel: 'Artist', thumbnail: '', duration: 200 };

    const addTrack = createAddTrack(repo);
    const result = await addTrack('user1', 'pl1', track);

    expect(result).toEqual(mockTrack);
    expect(repo.addTrack).toHaveBeenCalledWith('user1', 'pl1', track);
  });

  it('returns null when track already exists', async () => {
    const repo = createMockPlaylistRepo();
    repo.addTrack.mockResolvedValue(null);

    const addTrack = createAddTrack(repo);
    const result = await addTrack('user1', 'pl1', { videoId: 'v1', title: 'S', channel: 'A', thumbnail: '', duration: 200 });

    expect(result).toBeNull();
  });
});

describe('createRemoveTrack', () => {
  it('removes a track and returns true', async () => {
    const repo = createMockPlaylistRepo();
    repo.removeTrack.mockResolvedValue(true);

    const removeTrack = createRemoveTrack(repo);
    const result = await removeTrack('user1', 'pl1', 'v1');

    expect(result).toBe(true);
    expect(repo.removeTrack).toHaveBeenCalledWith('user1', 'pl1', 'v1');
  });

  it('returns false when track not found', async () => {
    const repo = createMockPlaylistRepo();
    repo.removeTrack.mockResolvedValue(false);

    const removeTrack = createRemoveTrack(repo);
    const result = await removeTrack('user1', 'pl1', 'nonexistent');

    expect(result).toBe(false);
  });
});

describe('createReorderTracks', () => {
  it('reorders tracks and returns true', async () => {
    const repo = createMockPlaylistRepo();
    repo.reorderTracks.mockResolvedValue(true);

    const reorder = createReorderTracks(repo);
    const result = await reorder('user1', 'pl1', [3, 1, 2]);

    expect(result).toBe(true);
    expect(repo.reorderTracks).toHaveBeenCalledWith('user1', 'pl1', [3, 1, 2]);
  });
});

describe('createDuplicatePlaylist', () => {
  it('duplicates a playlist', async () => {
    const repo = createMockPlaylistRepo();
    const dup = { ...mockPlaylist, id: 'pl2', name: 'My Playlist (copy)' };
    repo.duplicate.mockResolvedValue(dup);

    const duplicate = createDuplicatePlaylist(repo);
    const result = await duplicate('user1', 'pl1');

    expect(result).toEqual(dup);
    expect(repo.duplicate).toHaveBeenCalledWith('user1', 'pl1');
  });

  it('returns null when source not found', async () => {
    const repo = createMockPlaylistRepo();
    repo.duplicate.mockResolvedValue(null);

    const duplicate = createDuplicatePlaylist(repo);
    const result = await duplicate('user1', 'nonexistent');

    expect(result).toBeNull();
  });
});

describe('createGetSharedPlaylist', () => {
  it('returns a shared playlist by shareId', async () => {
    const repo = createMockPlaylistRepo();
    repo.getShared.mockResolvedValue(mockPlaylist);

    const getShared = createGetSharedPlaylist(repo);
    const result = await getShared('share123');

    expect(result).toEqual(mockPlaylist);
    expect(repo.getShared).toHaveBeenCalledWith('share123');
  });

  it('returns null when shareId not found', async () => {
    const repo = createMockPlaylistRepo();
    repo.getShared.mockResolvedValue(null);

    const getShared = createGetSharedPlaylist(repo);
    const result = await getShared('nonexistent');

    expect(result).toBeNull();
  });
});

describe('createGetSmartPlaylistTracks', () => {
  it('returns tracks matching smart playlist rules', async () => {
    const repo = createMockPlaylistRepo();
    const rules = { match: 'all' as const, conditions: [{ field: 'channel' as const, operator: 'contains' as const, value: 'Artist' }] };
    repo.getSmartPlaylistTracks.mockResolvedValue([mockTrack]);

    const getSmartTracks = createGetSmartPlaylistTracks(repo);
    const result = await getSmartTracks('user1', rules);

    expect(result).toEqual([mockTrack]);
    expect(repo.getSmartPlaylistTracks).toHaveBeenCalledWith('user1', rules);
  });
});

describe('createGetFolders', () => {
  it('returns all folders for a user', async () => {
    const repo = createMockFolderRepo();
    repo.getAll.mockResolvedValue([mockFolder]);

    const getFolders = createGetFolders(repo);
    const result = await getFolders('user1');

    expect(result).toEqual([mockFolder]);
    expect(repo.getAll).toHaveBeenCalledWith('user1');
  });

  it('returns empty array when no folders', async () => {
    const repo = createMockFolderRepo();
    repo.getAll.mockResolvedValue([]);

    const getFolders = createGetFolders(repo);
    const result = await getFolders('user1');

    expect(result).toEqual([]);
  });
});

describe('createCreateFolder', () => {
  it('creates a folder', async () => {
    const repo = createMockFolderRepo();
    repo.create.mockResolvedValue(mockFolder);

    const create = createCreateFolder(repo);
    const result = await create('user1', 'Folder 1');

    expect(result).toEqual(mockFolder);
    expect(repo.create).toHaveBeenCalledWith('user1', 'Folder 1');
  });
});

describe('createUpdateFolder', () => {
  it('updates a folder', async () => {
    const repo = createMockFolderRepo();
    const updated = { ...mockFolder, name: 'Updated' };
    repo.update.mockResolvedValue(updated);

    const update = createUpdateFolder(repo);
    const result = await update('user1', 'f1', { name: 'Updated' });

    expect(result).toEqual(updated);
    expect(repo.update).toHaveBeenCalledWith('user1', 'f1', { name: 'Updated' });
  });

  it('returns null when folder not found', async () => {
    const repo = createMockFolderRepo();
    repo.update.mockResolvedValue(null);

    const update = createUpdateFolder(repo);
    const result = await update('user1', 'nonexistent', { name: 'X' });

    expect(result).toBeNull();
  });
});

describe('createDeleteFolder', () => {
  it('deletes a folder and returns true', async () => {
    const repo = createMockFolderRepo();
    repo.delete.mockResolvedValue(true);

    const del = createDeleteFolder(repo);
    const result = await del('user1', 'f1');

    expect(result).toBe(true);
    expect(repo.delete).toHaveBeenCalledWith('user1', 'f1');
  });

  it('returns false when folder not found', async () => {
    const repo = createMockFolderRepo();
    repo.delete.mockResolvedValue(false);

    const del = createDeleteFolder(repo);
    const result = await del('user1', 'nonexistent');

    expect(result).toBe(false);
  });
});

describe('createMovePlaylistToFolder', () => {
  it('moves a playlist to a folder', async () => {
    const repo = createMockFolderRepo();
    repo.movePlaylist.mockResolvedValue(true);

    const move = createMovePlaylistToFolder(repo);
    const result = await move('user1', 'pl1', 'f1');

    expect(result).toBe(true);
    expect(repo.movePlaylist).toHaveBeenCalledWith('user1', 'pl1', 'f1');
  });

  it('moves a playlist out of folders with null folderId', async () => {
    const repo = createMockFolderRepo();
    repo.movePlaylist.mockResolvedValue(true);

    const move = createMovePlaylistToFolder(repo);
    const result = await move('user1', 'pl1', null);

    expect(result).toBe(true);
    expect(repo.movePlaylist).toHaveBeenCalledWith('user1', 'pl1', null);
  });
});
