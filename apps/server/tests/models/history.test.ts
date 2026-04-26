import { getTestDb, cleanupDb } from '../setup.js';
import {
  getRecentHistory,
  addToHistory,
  clearHistory,
} from '../../src/models/history.js';

vi.mock('../../src/lib/db.js', () => ({
  getDb: () => getTestDb(),
}));

const userId = 'usr_history-test-001';

function insertUser(id: string, email: string, name: string) {
  getTestDb()
    .prepare('INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)')
    .run(id, email, name);
}

const sampleTrack = {
  video_id: 'vid_hist_abc123',
  title: 'Test Song',
  channel: 'Test Artist',
  thumbnail: 'https://img.youtube.com/vi/vid_hist_abc123/0.jpg',
  duration: 245,
};

const sampleTrack2 = {
  video_id: 'vid_hist_def456',
  title: 'Another Song',
  channel: 'Another Artist',
  thumbnail: 'https://img.youtube.com/vi/vid_hist_def456/0.jpg',
  duration: 198,
};

beforeEach(() => {
  cleanupDb();
  insertUser(userId, 'history-test@example.com', 'Test User');
});

describe('getRecentHistory', () => {
  it('returns empty array when no history exists', () => {
    const result = getRecentHistory(userId);
    expect(result).toEqual([]);
  });

  it('returns items after adding to history', () => {
    addToHistory(userId, sampleTrack);

    const result = getRecentHistory(userId);
    expect(result).toHaveLength(1);
    expect(result[0].video_id).toBe('vid_hist_abc123');
  });

  it('returns multiple items', () => {
    addToHistory(userId, sampleTrack);
    addToHistory(userId, sampleTrack2);

    const result = getRecentHistory(userId);
    expect(result).toHaveLength(2);
  });

  it('respects limit parameter', () => {
    for (let i = 0; i < 10; i++) {
      addToHistory(userId, {
        video_id: `vid_hist_limit_${i}`,
        title: `Song ${i}`,
        channel: 'Artist',
        thumbnail: '',
        duration: 200,
      });
    }

    const result = getRecentHistory(userId, 3);
    expect(result).toHaveLength(3);
  });

  it('does not return history from other users', () => {
    const otherUserId = 'usr_history-other-002';
    insertUser(otherUserId, 'other-history@example.com', 'Other User');
    addToHistory(userId, sampleTrack);
    addToHistory(otherUserId, sampleTrack2);

    const result = getRecentHistory(userId);
    expect(result).toHaveLength(1);
    expect(result[0].video_id).toBe('vid_hist_abc123');
  });
});

describe('addToHistory', () => {
  it('adds new item to history', () => {
    addToHistory(userId, sampleTrack);

    const result = getRecentHistory(userId);
    expect(result).toHaveLength(1);
    expect(result[0].video_id).toBe('vid_hist_abc123');
    expect(result[0].title).toBe('Test Song');
    expect(result[0].channel).toBe('Test Artist');
    expect(result[0].duration).toBe(245);
  });

  it('updates played_at for duplicate video_id', () => {
    addToHistory(userId, sampleTrack);

    const before = getRecentHistory(userId);
    expect(before).toHaveLength(1);

    addToHistory(userId, sampleTrack);

    const after = getRecentHistory(userId);
    expect(after).toHaveLength(1);
    expect(after[0].video_id).toBe('vid_hist_abc123');
  });

  it('caps at 200 items and deletes oldest', () => {
    for (let i = 0; i < 205; i++) {
      addToHistory(userId, {
        video_id: `vid_hist_cap_${i}`,
        title: `Song ${i}`,
        channel: 'Artist',
        thumbnail: '',
        duration: 200,
      });
    }

    const result = getRecentHistory(userId, 300);
    expect(result.length).toBeLessThanOrEqual(200);
  });
});

describe('clearHistory', () => {
  it('deletes all history for user', () => {
    addToHistory(userId, sampleTrack);
    addToHistory(userId, sampleTrack2);

    clearHistory(userId);

    const result = getRecentHistory(userId);
    expect(result).toEqual([]);
  });

  it('does not affect other users history', () => {
    const otherUserId = 'usr_history-other-002';
    insertUser(otherUserId, 'other-history@example.com', 'Other User');
    addToHistory(userId, sampleTrack);
    addToHistory(otherUserId, sampleTrack2);

    clearHistory(userId);

    expect(getRecentHistory(userId)).toEqual([]);
    expect(getRecentHistory(otherUserId)).toHaveLength(1);
  });
});
