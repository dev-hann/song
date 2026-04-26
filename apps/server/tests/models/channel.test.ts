import { getTestDb, cleanupDb } from '../setup.js';
import {
  getFollowedChannels,
  followChannel,
  unfollowChannel,
  isFollowing,
} from '../../src/models/channel.js';

vi.mock('../../src/lib/db.js', () => ({
  getDb: () => getTestDb(),
}));

const userId = 'usr_channel-test-001';

function insertUser(id: string, email: string, name: string) {
  getTestDb()
    .prepare('INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)')
    .run(id, email, name);
}

const sampleChannel = {
  channel_id: 'ch_channel_abc123',
  channel_name: 'Test Channel',
  channel_thumbnail: 'https://img.youtube.com/ch_abc123/avatar.jpg',
  subscriber_count: '1000000',
};

const sampleChannel2 = {
  channel_id: 'ch_channel_def456',
  channel_name: 'Another Channel',
  channel_thumbnail: 'https://img.youtube.com/ch_def456/avatar.jpg',
  subscriber_count: '500000',
};

beforeEach(() => {
  cleanupDb();
  insertUser(userId, 'channel-test@example.com', 'Test User');
});

describe('getFollowedChannels', () => {
  it('returns empty array when no followed channels', () => {
    const result = getFollowedChannels(userId);
    expect(result).toEqual([]);
  });

  it('returns followed channels', () => {
    followChannel(userId, sampleChannel);
    followChannel(userId, sampleChannel2);

    const result = getFollowedChannels(userId);
    expect(result).toHaveLength(2);
    const ids = result.map((c) => c.channel_id);
    expect(ids).toContain('ch_channel_abc123');
    expect(ids).toContain('ch_channel_def456');
  });

  it('does not return channels from other users', () => {
    const otherUserId = 'usr_channel-other-002';
    insertUser(otherUserId, 'other-channel@example.com', 'Other User');
    followChannel(userId, sampleChannel);
    followChannel(otherUserId, sampleChannel2);

    const result = getFollowedChannels(userId);
    expect(result).toHaveLength(1);
    expect(result[0].channel_id).toBe('ch_channel_abc123');
  });
});

describe('followChannel', () => {
  it('follows channel and returns it', () => {
    const result = followChannel(userId, sampleChannel);

    expect(result).toBeDefined();
    expect(result.channel_id).toBe('ch_channel_abc123');
    expect(result.channel_name).toBe('Test Channel');
    expect(result.channel_thumbnail).toBe(
      'https://img.youtube.com/ch_abc123/avatar.jpg',
    );
    expect(result.subscriber_count).toBe('1000000');
    expect(result.followed_at).toBeDefined();
  });

  it('handles INSERT OR REPLACE on duplicate channel_id', () => {
    followChannel(userId, sampleChannel);
    const updated = followChannel(userId, {
      ...sampleChannel,
      channel_name: 'Updated Channel',
    });

    expect(updated.channel_name).toBe('Updated Channel');

    const all = getFollowedChannels(userId);
    expect(all).toHaveLength(1);
    expect(all[0].channel_name).toBe('Updated Channel');
  });
});

describe('unfollowChannel', () => {
  it('unfollows channel and returns true', () => {
    followChannel(userId, sampleChannel);
    const result = unfollowChannel(userId, sampleChannel.channel_id);

    expect(result).toBe(true);
    expect(getFollowedChannels(userId)).toEqual([]);
  });

  it('returns false for non-followed channel', () => {
    const result = unfollowChannel(userId, 'nonexistent_channel');
    expect(result).toBe(false);
  });
});

describe('isFollowing', () => {
  it('returns true when following', () => {
    followChannel(userId, sampleChannel);
    expect(isFollowing(userId, sampleChannel.channel_id)).toBe(true);
  });

  it('returns false when not following', () => {
    expect(isFollowing(userId, sampleChannel.channel_id)).toBe(false);
  });
});
