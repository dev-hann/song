// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockDb, resetMocks } = vi.hoisted(() => {
  const self: Record<string, ReturnType<typeof vi.fn>> = {};
  const methodNames = [
    'select', 'from', 'where', 'orderBy', 'limit',
    'insert', 'values', 'returning', 'update', 'set', 'delete',
  ];

  function resetMocks() {
    for (const name of methodNames) {
      self[name] = vi.fn().mockImplementation(() => self);
    }
    self.transaction = vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => { await fn(self); });
  }

  resetMocks();
  return { mockDb: self, resetMocks };
});

vi.mock('@/server/db', () => ({
  db: mockDb,
}));

import {
  getAllPlaylists,
  getPlaylistById,
  createPlaylist,
  getOrCreateLikedPlaylist,
  updatePlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
  evaluateSmartPlaylistRules,
} from '../playlist';

const mockPlaylistRow = {
  id: 'pl_123',
  userId: 'usr_1',
  name: 'My Playlist',
  description: '',
  coverImage: '',
  isSystem: false,
  trackCount: 2,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-02',
};

const mockTrackRows = [
  {
    id: 1,
    playlistId: 'pl_123',
    videoId: 'vid1',
    title: 'Song 1',
    channel: 'Channel 1',
    thumbnail: 'thumb1',
    duration: 200,
    sortOrder: 0,
    addedAt: '2025-01-01',
  },
  {
    id: 2,
    playlistId: 'pl_123',
    videoId: 'vid2',
    title: 'Song 2',
    channel: 'Channel 2',
    thumbnail: 'thumb2',
    duration: 180,
    sortOrder: 1,
    addedAt: '2025-01-01',
  },
];

describe('playlist model', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('getAllPlaylists', () => {
    it('returns all playlists for user', async () => {
      mockDb.orderBy.mockResolvedValueOnce([{ ...mockPlaylistRow, trackCount: 2 }]);

      const result = await getAllPlaylists('usr_1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pl_123');
    });

    it('returns empty array when no playlists', async () => {
      mockDb.orderBy.mockResolvedValueOnce([]);

      const result = await getAllPlaylists('usr_1');

      expect(result).toEqual([]);
    });
  });

  describe('getPlaylistById', () => {
    it('returns playlist with tracks when found', async () => {
      mockDb.where.mockResolvedValueOnce([mockPlaylistRow]);
      mockDb.orderBy.mockResolvedValueOnce(mockTrackRows);

      const result = await getPlaylistById('usr_1', 'pl_123');

      expect(result).toBeTruthy();
      expect(result?.tracks).toHaveLength(2);
      expect(result?.trackCount).toBe(2);
    });

    it('returns null when playlist not found', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await getPlaylistById('usr_1', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createPlaylist', () => {
    it('creates and returns playlist', async () => {
      mockDb.values.mockResolvedValueOnce(undefined);
      mockDb.where.mockResolvedValueOnce([mockPlaylistRow]);
      mockDb.orderBy.mockResolvedValueOnce([]);

      const result = await createPlaylist('usr_1', 'New Playlist', 'desc');

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('uses empty description by default', async () => {
      mockDb.values.mockResolvedValueOnce(undefined);
      mockDb.where.mockResolvedValueOnce([mockPlaylistRow]);
      mockDb.orderBy.mockResolvedValueOnce([]);

      await createPlaylist('usr_1', 'New Playlist');

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({ description: '' }),
      );
    });

    it('throws when creation fails', async () => {
      mockDb.values.mockResolvedValueOnce(undefined);
      mockDb.where.mockResolvedValueOnce([]);

      await expect(createPlaylist('usr_1', 'Fail')).rejects.toThrow('Failed to create playlist');
    });
  });

  describe('getOrCreateLikedPlaylist', () => {
    it('returns existing liked playlist', async () => {
      const likedRow = { ...mockPlaylistRow, isSystem: true, name: '좋아요한 곡' };
      mockDb.where.mockResolvedValueOnce([likedRow]);
      mockDb.where.mockResolvedValueOnce([likedRow]);
      mockDb.orderBy.mockResolvedValueOnce([]);

      const result = await getOrCreateLikedPlaylist('usr_1');

      expect(result).toBeTruthy();
      expect(result.id).toBe('pl_123');
    });

    it('creates liked playlist when not found', async () => {
      mockDb.where.mockResolvedValueOnce([]);
      mockDb.values.mockResolvedValueOnce(undefined);
      const createdRow = { ...mockPlaylistRow, id: 'liked_usr_1', isSystem: true, name: '좋아요한 곡' };
      mockDb.where.mockResolvedValueOnce([createdRow]);
      mockDb.orderBy.mockResolvedValueOnce([]);

      const result = await getOrCreateLikedPlaylist('usr_1');

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result.id).toBe('liked_usr_1');
    });

    it('throws when creation of liked playlist fails', async () => {
      mockDb.where.mockResolvedValueOnce([]);
      mockDb.values.mockResolvedValueOnce(undefined);
      mockDb.where.mockResolvedValueOnce([]);

      await expect(getOrCreateLikedPlaylist('usr_1')).rejects.toThrow('Failed to create liked playlist');
    });
  });

  describe('updatePlaylist', () => {
    it('updates name and description', async () => {
      mockDb.where.mockResolvedValueOnce([mockPlaylistRow]);
      mockDb.where.mockResolvedValueOnce(undefined);
      mockDb.where.mockResolvedValueOnce([mockPlaylistRow]);
      mockDb.orderBy.mockResolvedValueOnce([]);

      const result = await updatePlaylist('usr_1', 'pl_123', {
        name: 'Updated',
        description: 'New desc',
      });

      expect(mockDb.update).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('returns null when playlist not found', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await updatePlaylist('usr_1', 'nonexistent', { name: 'X' });

      expect(result).toBeNull();
    });
  });

  describe('deletePlaylist', () => {
    it('deletes non-system playlist', async () => {
      mockDb.where.mockResolvedValueOnce([mockPlaylistRow]);
      mockDb.where.mockResolvedValueOnce(undefined);
      mockDb.where.mockResolvedValueOnce(undefined);

      const result = await deletePlaylist('usr_1', 'pl_123');

      expect(result).toBe(true);
      expect(mockDb.delete).toHaveBeenCalledTimes(2);
    });

    it('returns false for system playlist', async () => {
      mockDb.where.mockResolvedValueOnce([{ ...mockPlaylistRow, isSystem: true }]);

      const result = await deletePlaylist('usr_1', 'pl_123');

      expect(result).toBe(false);
    });

    it('returns false when playlist not found', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await deletePlaylist('usr_1', 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('addTrackToPlaylist', () => {
    it('adds track to playlist', async () => {
      mockDb.where.mockResolvedValueOnce([mockPlaylistRow]);
      mockDb.where.mockResolvedValueOnce([]);
      mockDb.where.mockResolvedValueOnce([{ maxOrder: null }]);
      mockDb.returning.mockResolvedValueOnce([{ id: 1 }]);
      mockDb.where.mockResolvedValueOnce(undefined);
      mockDb.where.mockResolvedValueOnce([mockTrackRows[0]]);

      const result = await addTrackToPlaylist('usr_1', 'pl_123', {
        videoId: 'vid1',
        title: 'Song 1',
        channel: 'Channel 1',
        thumbnail: 'thumb1',
        duration: 200,
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result?.videoId).toBe('vid1');
    });

    it('returns null when playlist not found', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await addTrackToPlaylist('usr_1', 'nonexistent', {
        videoId: 'vid1',
        title: 'Song',
        channel: 'Ch',
        thumbnail: '',
        duration: 100,
      });

      expect(result).toBeNull();
    });

    it('returns null when track already exists', async () => {
      mockDb.where.mockResolvedValueOnce([mockPlaylistRow]);
      mockDb.where.mockResolvedValueOnce([{ id: 1 }]);

      const result = await addTrackToPlaylist('usr_1', 'pl_123', {
        videoId: 'vid1',
        title: 'Song',
        channel: 'Ch',
        thumbnail: '',
        duration: 100,
      });

      expect(result).toBeNull();
    });
  });

  describe('removeTrackFromPlaylist', () => {
    it('returns true when track removed', async () => {
      mockDb.where.mockResolvedValueOnce([mockPlaylistRow]);
      mockDb.where
        .mockImplementationOnce(() => mockDb);
      mockDb.returning.mockResolvedValueOnce([{ id: 1 }]);
      mockDb.where.mockResolvedValueOnce(undefined);

      const result = await removeTrackFromPlaylist('usr_1', 'pl_123', 'vid1');

      expect(result).toBe(true);
    });

    it('returns false when no track removed', async () => {
      mockDb.where.mockResolvedValueOnce([mockPlaylistRow]);
      mockDb.where
        .mockImplementationOnce(() => mockDb);
      mockDb.returning.mockResolvedValueOnce([]);
      mockDb.where.mockResolvedValueOnce(undefined);

      const result = await removeTrackFromPlaylist('usr_1', 'pl_123', 'nonexistent');

      expect(result).toBe(false);
    });

    it('returns false when playlist not found', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await removeTrackFromPlaylist('usr_1', 'nonexistent', 'vid1');

      expect(result).toBe(false);
    });
  });

  describe('reorderPlaylistTracks', () => {
    it('reorders tracks within transaction', async () => {
      mockDb.where.mockResolvedValueOnce([mockPlaylistRow]);
      mockDb.where.mockResolvedValue(undefined);

      const result = await reorderPlaylistTracks('usr_1', 'pl_123', [3, 1, 2]);

      expect(result).toBe(true);
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('returns false when playlist not found', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await reorderPlaylistTracks('usr_1', 'nonexistent', [1, 2]);

      expect(result).toBe(false);
    });
  });

  describe('evaluateSmartPlaylistRules', () => {
    const tracks = [
      { title: 'Butter', channel: 'BTS', duration: 200, addedAt: '2025-06-01' },
      { title: 'Dynamite', channel: 'BTS', duration: 180, addedAt: '2025-05-01' },
      { title: 'Stay', channel: 'The Kid LAROI', duration: 150, addedAt: '2025-04-01' },
    ];

    it('filters by channel containing text (match all)', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'channel' as const, operator: 'contains' as const, value: 'BTS' }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.channel === 'BTS')).toBe(true);
    });

    it('filters by title containing text (match any)', () => {
      const rules = { match: 'any' as const, conditions: [
        { field: 'title' as const, operator: 'contains' as const, value: 'Butter' },
        { field: 'title' as const, operator: 'contains' as const, value: 'Stay' },
      ] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toHaveLength(2);
    });

    it('filters by duration greater than', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'minDuration' as const, operator: 'gt' as const, value: 170 }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toHaveLength(2);
    });

    it('filters by duration less than', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'maxDuration' as const, operator: 'lt' as const, value: 170 }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Stay');
    });

    it('filters by added after date', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'addedAfter' as const, operator: 'gte' as const, value: '2025-05-01' }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toHaveLength(2);
    });

    it('combines multiple conditions with match all', () => {
      const rules = { match: 'all' as const, conditions: [
        { field: 'channel' as const, operator: 'contains' as const, value: 'BTS' },
        { field: 'minDuration' as const, operator: 'gt' as const, value: 190 },
      ] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Butter');
    });

    it('returns empty when no conditions match', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'channel' as const, operator: 'contains' as const, value: 'nonexistent' }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toHaveLength(0);
    });

    it('handles startsWith operator', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'title' as const, operator: 'startsWith' as const, value: 'dyn' }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Dynamite');
    });

    it('handles equals operator', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'title' as const, operator: 'equals' as const, value: 'Stay' }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Stay');
    });
  });

  describe('updatePlaylist with new fields', () => {
    it('updates rules', async () => {
      const existingRow = { ...mockPlaylistRow, rules: null, folderId: null, isPublic: false, shareId: null };
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([existingRow]);
      mockDb.update.mockReturnValueOnce(mockDb);
      mockDb.set.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce(undefined);
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([existingRow]);
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockResolvedValueOnce([]);

      const rules = { match: 'all' as const, conditions: [{ field: 'channel' as const, operator: 'contains' as const, value: 'BTS' }] };
      await updatePlaylist('usr_1', 'pl_123', { rules });

      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ rules }),
      );
    });

    it('generates shareId when isPublic is set to true', async () => {
      const existingRow = { ...mockPlaylistRow, rules: null, folderId: null, isPublic: false, shareId: null };
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([existingRow]);
      mockDb.update.mockReturnValueOnce(mockDb);
      mockDb.set.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce(undefined);
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([existingRow]);
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockResolvedValueOnce([]);

      await updatePlaylist('usr_1', 'pl_123', { isPublic: true });

      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ isPublic: true, shareId: expect.any(String) }),
      );
    });

    it('clears shareId when isPublic is set to false', async () => {
      const existingRow = { ...mockPlaylistRow, rules: null, folderId: null, isPublic: true, shareId: 'abc-123' };
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([existingRow]);
      mockDb.update.mockReturnValueOnce(mockDb);
      mockDb.set.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce(undefined);
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([existingRow]);
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockResolvedValueOnce([]);

      await updatePlaylist('usr_1', 'pl_123', { isPublic: false });

      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ isPublic: false, shareId: null }),
      );
    });
  });
});
