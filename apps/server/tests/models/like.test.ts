import { getTestDb, cleanupDb } from '../setup.js';
import {
  getAllLikes,
  addLike,
  removeLike,
  isLiked,
  getLikedVideoIds,
} from '../../src/models/like.js';

vi.mock('../../src/lib/db.js', () => ({
  getDb: () => getTestDb(),
}));

const userId = 'usr_like-test-001';

function insertUser(id: string, email: string, name: string) {
  getTestDb()
    .prepare('INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)')
    .run(id, email, name);
}

const sampleTrack = {
  video_id: 'vid_like_abc123',
  title: 'Test Song',
  channel: 'Test Artist',
  thumbnail: 'https://img.youtube.com/vi/vid_like_abc123/0.jpg',
  duration: 245,
};

const sampleTrack2 = {
  video_id: 'vid_like_def456',
  title: 'Another Song',
  channel: 'Another Artist',
  thumbnail: 'https://img.youtube.com/vi/vid_like_def456/0.jpg',
  duration: 198,
};

beforeEach(() => {
  cleanupDb();
  insertUser(userId, 'like-test@example.com', 'Test User');
});

describe('getAllLikes', () => {
  it('returns empty array when no likes exist', () => {
    const result = getAllLikes(userId);
    expect(result).toEqual([]);
  });

  it('returns likes after adding', () => {
    addLike(userId, sampleTrack);

    const result = getAllLikes(userId);
    expect(result).toHaveLength(1);
    expect(result[0].video_id).toBe('vid_like_abc123');
  });

  it('returns multiple likes', () => {
    addLike(userId, sampleTrack);
    addLike(userId, sampleTrack2);

    const result = getAllLikes(userId);
    expect(result).toHaveLength(2);
  });

  it('does not return likes from other users', () => {
    const otherUserId = 'usr_like-other-002';
    insertUser(otherUserId, 'other-like@example.com', 'Other User');
    addLike(userId, sampleTrack);
    addLike(otherUserId, sampleTrack2);

    const result = getAllLikes(userId);
    expect(result).toHaveLength(1);
    expect(result[0].video_id).toBe('vid_like_abc123');
  });
});

describe('addLike', () => {
  it('adds like and returns it', () => {
    const result = addLike(userId, sampleTrack);

    expect(result).toBeDefined();
    expect(result.video_id).toBe('vid_like_abc123');
    expect(result.title).toBe('Test Song');
    expect(result.channel).toBe('Test Artist');
    expect(result.duration).toBe(245);
    expect(result.liked_at).toBeDefined();
  });

  it('handles INSERT OR REPLACE on duplicate video_id', () => {
    addLike(userId, sampleTrack);
    const updated = addLike(userId, {
      ...sampleTrack,
      title: 'Updated Title',
    });

    expect(updated.title).toBe('Updated Title');

    const all = getAllLikes(userId);
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Updated Title');
  });
});

describe('removeLike', () => {
  it('removes like and returns true', () => {
    addLike(userId, sampleTrack);
    const result = removeLike(userId, sampleTrack.video_id);

    expect(result).toBe(true);
    expect(getAllLikes(userId)).toEqual([]);
  });

  it('returns false for non-existent like', () => {
    const result = removeLike(userId, 'nonexistent_vid');
    expect(result).toBe(false);
  });
});

describe('isLiked', () => {
  it('returns true when liked', () => {
    addLike(userId, sampleTrack);
    expect(isLiked(userId, sampleTrack.video_id)).toBe(true);
  });

  it('returns false when not liked', () => {
    expect(isLiked(userId, sampleTrack.video_id)).toBe(false);
  });
});

describe('getLikedVideoIds', () => {
  it('returns empty array when no likes', () => {
    const result = getLikedVideoIds(userId);
    expect(result).toEqual([]);
  });

  it('returns array of video_id strings', () => {
    addLike(userId, sampleTrack);
    addLike(userId, sampleTrack2);

    const result = getLikedVideoIds(userId);
    expect(result).toHaveLength(2);
    expect(result).toContain('vid_like_abc123');
    expect(result).toContain('vid_like_def456');
  });
});
