// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  onConflictDoUpdate: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  transaction: vi.fn(),
};

vi.mock('@/server/db', () => ({ db: mockDb }));

vi.mock('@/server/db/schema', () => ({
  playlists: {
    id: 'id', userId: 'userId', name: 'name', description: 'description',
    coverImage: 'coverImage', isSystem: 'isSystem', trackCount: 'trackCount',
    rules: 'rules', folderId: 'folderId', isPublic: 'isPublic', shareId: 'shareId',
    createdAt: 'createdAt', updatedAt: 'updatedAt',
  },
  playlistTracks: {
    id: 'id', playlistId: 'playlistId', videoId: 'videoId', title: 'title',
    channel: 'channel', thumbnail: 'thumbnail', duration: 'duration',
    sortOrder: 'sortOrder', addedAt: 'addedAt',
  },
  likes: {
    userId: 'userId', videoId: 'videoId', title: 'title', channel: 'channel',
    thumbnail: 'thumbnail', duration: 'duration', likedAt: 'likedAt',
  },
  playlistFolders: {
    id: 'id', userId: 'userId', name: 'name', sortOrder: 'sortOrder', createdAt: 'createdAt',
  },
}));

vi.mock('../mappers/dto', async () => {
  return {
    toPlaylistDTO: vi.fn((row: Record<string, unknown>, tracks?: unknown[]) => ({ ...row, tracks: tracks ?? [] })),
    toPlaylistTrackDTO: vi.fn((row: Record<string, unknown>) => ({ ...row })),
    toPlaylistFolderDTO: vi.fn((row: Record<string, unknown>) => ({ ...row })),
  };
});

vi.mock('@/server/domain/rules/smart-playlist', () => ({
  evaluateSmartPlaylistRules: vi.fn((tracks: unknown[]) => tracks),
}));

vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' });

const playlistRow = {
  id: 'pl_1', userId: 'user1', name: 'My Playlist', description: 'desc',
  coverImage: '', isSystem: false, trackCount: 2, rules: null,
  folderId: null, isPublic: false, shareId: null,
  createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00',
};

const trackRow = {
  id: 1, playlistId: 'pl_1', videoId: 'v1', title: 'Song A',
  channel: 'Artist X', thumbnail: '', duration: 200,
  sortOrder: 0, addedAt: '2024-01-01 00:00:00',
};

const folderRow = {
  id: 'folder_1', userId: 'user1', name: 'Folder A',
  sortOrder: 0, createdAt: '2024-01-01 00:00:00',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.select.mockReturnThis();
  mockDb.from.mockReturnThis();
  mockDb.where.mockReturnThis();
  mockDb.orderBy.mockReturnThis();
  mockDb.limit.mockReturnThis();
  mockDb.insert.mockReturnThis();
  mockDb.values.mockReturnThis();
  mockDb.onConflictDoUpdate.mockReturnThis();
  mockDb.update.mockReturnThis();
  mockDb.set.mockReturnThis();
  mockDb.delete.mockReturnThis();
  mockDb.returning.mockReturnThis();
});

describe('playlistRepository', () => {
  it('getAll — returns mapped playlists', async () => {
    mockDb.orderBy.mockResolvedValueOnce([playlistRow]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.getAll('user1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('pl_1');
    expect(result[0].name).toBe('My Playlist');
  });

  it('getById — returns playlist with tracks when found', async () => {
    mockDb.where
      .mockResolvedValueOnce([playlistRow])
      .mockReturnValueOnce(mockDb);
    mockDb.orderBy.mockResolvedValueOnce([trackRow]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.getById('user1', 'pl_1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('pl_1');
    expect(result!.tracks).toHaveLength(1);
    expect(result!.tracks![0].videoId).toBe('v1');
  });

  it('getById — returns null when not found', async () => {
    mockDb.where.mockResolvedValueOnce([]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.getById('user1', 'pl_nonexistent');

    expect(result).toBeNull();
  });

  it('getOrCreateLiked — returns existing liked playlist', async () => {
    const likedRow = { ...playlistRow, id: 'liked_user1', isSystem: true, name: '좋아요한 곡' };

    mockDb.where
      .mockResolvedValueOnce([likedRow])
      .mockResolvedValueOnce([likedRow])
      .mockReturnValueOnce(mockDb);
    mockDb.orderBy.mockResolvedValueOnce([]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.getOrCreateLiked('user1');

    expect(result.id).toBe('liked_user1');
  });

  it('getOrCreateLiked — creates new liked playlist when none exists', async () => {
    mockDb.where
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...playlistRow, id: 'liked_user1', isSystem: true, name: '좋아요한 곡' }])
      .mockReturnValueOnce(mockDb);
    mockDb.values.mockResolvedValueOnce(undefined);
    mockDb.orderBy.mockResolvedValueOnce([]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.getOrCreateLiked('user1');

    expect(result.id).toBe('liked_user1');
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('create — creates and returns playlist', async () => {
    mockDb.where
      .mockResolvedValueOnce([{ ...playlistRow, id: 'pl_test-uuid' }])
      .mockReturnValueOnce(mockDb);
    mockDb.values.mockResolvedValueOnce(undefined);
    mockDb.orderBy.mockResolvedValueOnce([]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.create('user1', 'New Playlist', 'desc');

    expect(result.id).toBe('pl_test-uuid');
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('update — updates playlist fields', async () => {
    mockDb.where
      .mockResolvedValueOnce([playlistRow])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ ...playlistRow, name: 'Updated' }])
      .mockReturnValueOnce(mockDb);
    mockDb.orderBy.mockResolvedValueOnce([]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.update('user1', 'pl_1', { name: 'Updated' });

    expect(result).not.toBeNull();
    expect(result!.name).toBe('Updated');
  });

  it('update — returns null when playlist not found', async () => {
    mockDb.where.mockResolvedValueOnce([]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.update('user1', 'pl_nonexistent', { name: 'Updated' });

    expect(result).toBeNull();
  });

  it('update — sets shareId when making public', async () => {
    mockDb.where
      .mockResolvedValueOnce([{ ...playlistRow, shareId: null }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ ...playlistRow, isPublic: true, shareId: 'test-uuid' }])
      .mockReturnValueOnce(mockDb);
    mockDb.orderBy.mockResolvedValueOnce([]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.update('user1', 'pl_1', { isPublic: true });

    expect(result!.shareId).toBe('test-uuid');
  });

  it('update — clears shareId when making private', async () => {
    mockDb.where
      .mockResolvedValueOnce([{ ...playlistRow, shareId: 'old-share-id', isPublic: true }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ ...playlistRow, isPublic: false, shareId: null }])
      .mockReturnValueOnce(mockDb);
    mockDb.orderBy.mockResolvedValueOnce([]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.update('user1', 'pl_1', { isPublic: false });

    expect(result!.shareId).toBeNull();
  });

  it('delete — deletes non-system playlist', async () => {
    mockDb.where
      .mockResolvedValueOnce([{ ...playlistRow, isSystem: false }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.delete('user1', 'pl_1');

    expect(result).toBe(true);
    expect(mockDb.delete).toHaveBeenCalledTimes(2);
  });

  it('delete — returns false for system playlist', async () => {
    mockDb.where.mockResolvedValueOnce([{ ...playlistRow, isSystem: true }]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.delete('user1', 'pl_1');

    expect(result).toBe(false);
  });

  it('addTrack — adds track and returns it', async () => {
    const newTrackRow = {
      ...trackRow, id: 2, videoId: 'v2', title: 'Song B', sortOrder: 0,
    };

    mockDb.where
      .mockResolvedValueOnce([playlistRow])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ maxOrder: null }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([newTrackRow]);
    mockDb.returning.mockResolvedValueOnce([{ id: 2 }]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.addTrack('user1', 'pl_1', {
      videoId: 'v2', title: 'Song B', channel: 'Artist Y', thumbnail: '', duration: 180,
    });

    expect(result).not.toBeNull();
    expect(result!.videoId).toBe('v2');
  });

  it('addTrack — returns null when playlist not found', async () => {
    mockDb.where.mockResolvedValueOnce([]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.addTrack('user1', 'pl_nonexistent', {
      videoId: 'v2', title: 'Song B', channel: 'Artist Y', thumbnail: '', duration: 180,
    });

    expect(result).toBeNull();
  });

  it('addTrack — returns null when track already exists', async () => {
    mockDb.where
      .mockResolvedValueOnce([playlistRow])
      .mockResolvedValueOnce([{ id: 1 }]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.addTrack('user1', 'pl_1', {
      videoId: 'v1', title: 'Song A', channel: 'Artist X', thumbnail: '', duration: 200,
    });

    expect(result).toBeNull();
  });

  it('removeTrack — removes track', async () => {
    mockDb.where.mockResolvedValueOnce([playlistRow]);
    mockDb.returning.mockResolvedValueOnce([{ id: 1 }]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.removeTrack('user1', 'pl_1', 'v1');

    expect(result).toBe(true);
  });

  it('reorderTracks — reorders tracks in transaction', async () => {
    mockDb.where.mockResolvedValueOnce([playlistRow]);
    const txMock = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };
    mockDb.transaction.mockImplementationOnce(async (fn: (tx: unknown) => Promise<void>) => { await fn(txMock); });

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.reorderTracks('user1', 'pl_1', [2, 1]);

    expect(result).toBe(true);
    expect(mockDb.transaction).toHaveBeenCalled();
    expect(txMock.update).toHaveBeenCalledTimes(2);
  });

  it('duplicate — duplicates playlist with tracks', async () => {
    mockDb.where
      .mockResolvedValueOnce([playlistRow])
      .mockReturnValueOnce(mockDb)
      .mockResolvedValueOnce([{ ...playlistRow, id: 'pl_test-uuid' }])
      .mockReturnValueOnce(mockDb);
    mockDb.orderBy
      .mockResolvedValueOnce([trackRow])
      .mockResolvedValueOnce([]);

    mockDb.transaction.mockImplementationOnce(async (fn: (tx: unknown) => Promise<void>) => {
      const txMock = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue(undefined),
      };
      await fn(txMock);
    });

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.duplicate('user1', 'pl_1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('pl_test-uuid');
    expect(mockDb.transaction).toHaveBeenCalled();
  });

  it('getShared — returns shared public playlist', async () => {
    const sharedRow = { ...playlistRow, isPublic: true, shareId: 'share123' };

    mockDb.where
      .mockResolvedValueOnce([sharedRow])
      .mockReturnValueOnce(mockDb);
    mockDb.orderBy.mockResolvedValueOnce([trackRow]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.getShared('share123');

    expect(result).not.toBeNull();
    expect(result!.isPublic).toBe(true);
  });

  it('getShared — returns null when not found', async () => {
    mockDb.where.mockResolvedValueOnce([]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.getShared('nonexistent');

    expect(result).toBeNull();
  });

  it('getSmartPlaylistTracks — filters likes by rules', async () => {
    const likeRow1 = {
      userId: 'user1', videoId: 'v1', title: 'Song A', channel: 'Artist X',
      thumbnail: 'thumb.jpg', duration: 200, likedAt: '2024-01-01 00:00:00',
    };
    const likeRow2 = {
      userId: 'user1', videoId: 'v2', title: 'Song B', channel: 'Artist Y',
      thumbnail: 'thumb2.jpg', duration: 300, likedAt: '2024-01-02 00:00:00',
    };

    mockDb.where.mockReturnValueOnce(mockDb);
    mockDb.orderBy.mockResolvedValueOnce([likeRow1, likeRow2]);

    const { playlistRepository } = await import('../playlist.repository');
    const result = await playlistRepository.getSmartPlaylistTracks('user1', {
      match: 'all',
      conditions: [],
    });

    expect(result).toHaveLength(2);
    expect(result[0].videoId).toBe('v1');
    expect(result[1].videoId).toBe('v2');
  });
});

describe('folderRepository', () => {
  it('getAll — returns folders', async () => {
    mockDb.where.mockReturnValueOnce(mockDb);
    mockDb.orderBy.mockResolvedValueOnce([folderRow]);

    const { folderRepository } = await import('../playlist.repository');
    const result = await folderRepository.getAll('user1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('folder_1');
    expect(result[0].name).toBe('Folder A');
  });

  it('create — creates folder with auto sortOrder', async () => {
    mockDb.where.mockResolvedValueOnce([{ maxOrder: null }]);
    mockDb.values.mockResolvedValueOnce(undefined);
    mockDb.where.mockResolvedValueOnce([{ ...folderRow, id: 'folder_test-uuid' }]);

    const { folderRepository } = await import('../playlist.repository');
    const result = await folderRepository.create('user1', 'New Folder');

    expect(result.id).toBe('folder_test-uuid');
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('update — updates folder', async () => {
    mockDb.where
      .mockResolvedValueOnce([folderRow])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ ...folderRow, name: 'Updated Folder' }]);

    const { folderRepository } = await import('../playlist.repository');
    const result = await folderRepository.update('user1', 'folder_1', { name: 'Updated Folder' });

    expect(result).not.toBeNull();
    expect(result!.name).toBe('Updated Folder');
  });

  it('update — returns null when not found', async () => {
    mockDb.where.mockResolvedValueOnce([]);

    const { folderRepository } = await import('../playlist.repository');
    const result = await folderRepository.update('user1', 'folder_nonexistent', { name: 'Updated' });

    expect(result).toBeNull();
  });

  it('delete — deletes folder and unlinks playlists', async () => {
    mockDb.where
      .mockResolvedValueOnce([folderRow])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    const { folderRepository } = await import('../playlist.repository');
    const result = await folderRepository.delete('user1', 'folder_1');

    expect(result).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it('delete — returns false when not found', async () => {
    mockDb.where.mockResolvedValueOnce([]);

    const { folderRepository } = await import('../playlist.repository');
    const result = await folderRepository.delete('user1', 'folder_nonexistent');

    expect(result).toBe(false);
  });

  it('movePlaylist — moves playlist to folder', async () => {
    mockDb.where
      .mockResolvedValueOnce([playlistRow])
      .mockResolvedValueOnce([folderRow]);

    const { folderRepository } = await import('../playlist.repository');
    const result = await folderRepository.movePlaylist('user1', 'pl_1', 'folder_1');

    expect(result).toBe(true);
  });

  it('movePlaylist — returns false when playlist not found', async () => {
    mockDb.where.mockResolvedValueOnce([]);

    const { folderRepository } = await import('../playlist.repository');
    const result = await folderRepository.movePlaylist('user1', 'pl_nonexistent', 'folder_1');

    expect(result).toBe(false);
  });
});
