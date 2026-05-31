// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockGetFollowedChannels } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetFollowedChannels: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/server/models/channel', () => ({
  getFollowedChannels: mockGetFollowedChannels,
}));

import { GET } from '../route';

const session = { user: { id: 'user1' } };
const channels = [
  { channel_id: 'ch1', channel_name: 'Channel 1', channel_thumbnail: '', subscriber_count: '1000', followed_at: '2024-01-01' },
  { channel_id: 'ch2', channel_name: 'Channel 2', channel_thumbnail: '', subscriber_count: '2000', followed_at: '2024-01-02' },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('GET /api/channels/followed', () => {
  it('returns followed channels', async () => {
    mockGetFollowedChannels.mockReturnValue(channels);

    const result = await GET(new Request('http://localhost/api/channels/followed'), { params: Promise.resolve({}) });

    expect(result.status).toBe(200);
    expect(result.body).toEqual(channels);
    expect(mockGetFollowedChannels).toHaveBeenCalledWith('user1');
  });

  it('returns empty array when no followed channels', async () => {
    mockGetFollowedChannels.mockReturnValue([]);

    const result = await GET(new Request('http://localhost/api/channels/followed'), { params: Promise.resolve({}) });

    expect(result.status).toBe(200);
    expect(result.body).toEqual([]);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await GET(new Request('http://localhost/api/channels/followed'), { params: Promise.resolve({}) });

    expect(result.status).toBe(401);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetFollowedChannels.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await GET(new Request('http://localhost/api/channels/followed'), { params: Promise.resolve({}) });

    expect(result.status).toBe(500);
  });
});
