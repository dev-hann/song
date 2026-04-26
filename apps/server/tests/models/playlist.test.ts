import { getTestDb, cleanupDb } from '../setup.js';
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
} from '../../src/models/playlist.js';

vi.mock('../../src/lib/db.js', () => ({
  getDb: () => getTestDb(),
}));

const userId = 'usr_playlist-test-001';

function insertUser(id: string, email: string, name: string) {
  getTestDb()
    .prepare('INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)')
    .run(id, email, name);
}

const sampleTrack = {
  video_id: 'vid_abc123',
  title: 'Test Song',
  channel: 'Test Artist',
  thumbnail: 'https://img.youtube.com/vi/vid_abc123/0.jpg',
  duration: 245,
};

const sampleTrack2 = {
  video_id: 'vid_def456',
  title: 'Another Song',
  channel: 'Another Artist',
  thumbnail: 'https://img.youtube.com/vi/vid_def456/0.jpg',
  duration: 198,
};

beforeEach(() => {
  cleanupDb();
  insertUser(userId, 'playlist-test@example.com', 'Test User');
});

describe('getAllPlaylists', () => {
  it('returns empty array when no playlists exist', () => {
    const result = getAllPlaylists(userId);
    expect(result).toEqual([]);
  });

  it('returns playlists after creation', () => {
    createPlaylist(userId, 'My Playlist', 'A description');
    createPlaylist(userId, 'Another Playlist');

    const result = getAllPlaylists(userId);
    expect(result).toHaveLength(2);
    const names = result.map((p) => p.name);
    expect(names).toContain('My Playlist');
    expect(names).toContain('Another Playlist');
  });

  it('does not return playlists from other users', () => {
    const otherUserId = 'usr_playlist-other-002';
    insertUser(otherUserId, 'other-playlist@example.com', 'Other User');
    createPlaylist(userId, 'My Playlist');
    createPlaylist(otherUserId, 'Other Playlist');

    const result = getAllPlaylists(userId);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('My Playlist');
  });
});

describe('getPlaylistById', () => {
  it('returns null for non-existent playlist', () => {
    const result = getPlaylistById(userId, 'nonexistent');
    expect(result).toBeNull();
  });

  it('returns playlist without tracks', () => {
    const created = createPlaylist(userId, 'My Playlist', 'desc');
    const result = getPlaylistById(userId, created.id);

    expect(result).not.toBeNull();
    expect(result!.name).toBe('My Playlist');
    expect(result!.description).toBe('desc');
    expect(result!.tracks).toEqual([]);
    expect(result!.track_count).toBe(0);
  });

  it('returns playlist with tracks', () => {
    const created = createPlaylist(userId, 'My Playlist');
    addTrackToPlaylist(userId, created.id, sampleTrack);
    addTrackToPlaylist(userId, created.id, sampleTrack2);

    const result = getPlaylistById(userId, created.id);
    expect(result!.tracks).toHaveLength(2);
    expect(result!.track_count).toBe(2);
    expect(result!.tracks[0].video_id).toBe('vid_abc123');
    expect(result!.tracks[1].video_id).toBe('vid_def456');
  });
});

describe('createPlaylist', () => {
  it('creates and returns playlist', () => {
    const result = createPlaylist(userId, 'New Playlist', 'Some desc');

    expect(result).toBeDefined();
    expect(result.id).toMatch(/^pl_/);
    expect(result.name).toBe('New Playlist');
    expect(result.description).toBe('Some desc');
    expect(result.is_system).toBe(0);
    expect(result.track_count).toBe(0);
  });

  it('creates playlist with empty description by default', () => {
    const result = createPlaylist(userId, 'No Desc Playlist');
    expect(result.description).toBe('');
  });
});

describe('getOrCreateLikedPlaylist', () => {
  it('creates system playlist on first call', () => {
    const result = getOrCreateLikedPlaylist(userId);

    expect(result).toBeDefined();
    expect(result.id).toBe(`liked_${userId}`);
    expect(result.name).toBe('좋아요한 곡');
    expect(result.is_system).toBe(1);
  });

  it('returns existing liked playlist on second call', () => {
    const first = getOrCreateLikedPlaylist(userId);
    const second = getOrCreateLikedPlaylist(userId);

    expect(first.id).toBe(second.id);
    expect(first.name).toBe(second.name);
  });
});

describe('updatePlaylist', () => {
  it('updates name', () => {
    const created = createPlaylist(userId, 'Original');
    const updated = updatePlaylist(userId, created.id, { name: 'Updated' });

    expect(updated).not.toBeNull();
    expect(updated!.name).toBe('Updated');
  });

  it('updates description', () => {
    const created = createPlaylist(userId, 'Playlist', 'old desc');
    const updated = updatePlaylist(userId, created.id, {
      description: 'new desc',
    });

    expect(updated!.description).toBe('new desc');
  });

  it('returns null for non-existent playlist', () => {
    const result = updatePlaylist(userId, 'nonexistent', { name: 'X' });
    expect(result).toBeNull();
  });
});

describe('deletePlaylist', () => {
  it('deletes non-system playlist', () => {
    const created = createPlaylist(userId, 'ToDelete');
    const result = deletePlaylist(userId, created.id);

    expect(result).toBe(true);
    expect(getPlaylistById(userId, created.id)).toBeNull();
  });

  it('returns false for system playlist', () => {
    const liked = getOrCreateLikedPlaylist(userId);
    const result = deletePlaylist(userId, liked.id);

    expect(result).toBe(false);
    expect(getPlaylistById(userId, liked.id)).not.toBeNull();
  });

  it('returns false for non-existent playlist', () => {
    const result = deletePlaylist(userId, 'nonexistent');
    expect(result).toBe(false);
  });
});

describe('addTrackToPlaylist', () => {
  it('adds track to playlist', () => {
    const created = createPlaylist(userId, 'Playlist');
    const track = addTrackToPlaylist(userId, created.id, sampleTrack);

    expect(track).not.toBeNull();
    expect(track!.video_id).toBe('vid_abc123');
    expect(track!.title).toBe('Test Song');
    expect(track!.channel).toBe('Test Artist');
    expect(track!.sort_order).toBe(0);
  });

  it('increments sort_order for subsequent tracks', () => {
    const created = createPlaylist(userId, 'Playlist');
    const t1 = addTrackToPlaylist(userId, created.id, sampleTrack);
    const t2 = addTrackToPlaylist(userId, created.id, sampleTrack2);

    expect(t1!.sort_order).toBe(0);
    expect(t2!.sort_order).toBe(1);
  });

  it('returns null for duplicate track', () => {
    const created = createPlaylist(userId, 'Playlist');
    addTrackToPlaylist(userId, created.id, sampleTrack);
    const duplicate = addTrackToPlaylist(userId, created.id, sampleTrack);

    expect(duplicate).toBeNull();
  });

  it('returns null for non-existent playlist', () => {
    const result = addTrackToPlaylist(userId, 'nonexistent', sampleTrack);
    expect(result).toBeNull();
  });
});

describe('removeTrackFromPlaylist', () => {
  it('removes track from playlist', () => {
    const created = createPlaylist(userId, 'Playlist');
    addTrackToPlaylist(userId, created.id, sampleTrack);
    const result = removeTrackFromPlaylist(
      userId,
      created.id,
      sampleTrack.video_id,
    );

    expect(result).toBe(true);
    const playlist = getPlaylistById(userId, created.id);
    expect(playlist!.tracks).toHaveLength(0);
  });

  it('returns false for non-existent track', () => {
    const created = createPlaylist(userId, 'Playlist');
    const result = removeTrackFromPlaylist(
      userId,
      created.id,
      'nonexistent_vid',
    );

    expect(result).toBe(false);
  });

  it('returns false for non-existent playlist', () => {
    const result = removeTrackFromPlaylist(
      userId,
      'nonexistent',
      sampleTrack.video_id,
    );
    expect(result).toBe(false);
  });
});

describe('reorderPlaylistTracks', () => {
  it('reorders tracks', () => {
    const created = createPlaylist(userId, 'Playlist');
    const t1 = addTrackToPlaylist(userId, created.id, sampleTrack);
    const t2 = addTrackToPlaylist(userId, created.id, sampleTrack2);

    expect(t1!.sort_order).toBe(0);
    expect(t2!.sort_order).toBe(1);

    reorderPlaylistTracks(userId, created.id, [t2!.id, t1!.id]);

    const playlist = getPlaylistById(userId, created.id);
    expect(playlist!.tracks[0].video_id).toBe('vid_def456');
    expect(playlist!.tracks[1].video_id).toBe('vid_abc123');
  });

  it('returns false for non-existent playlist', () => {
    const result = reorderPlaylistTracks(userId, 'nonexistent', [1, 2]);
    expect(result).toBe(false);
  });
});
