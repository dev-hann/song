// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockFollowChannel, mockUnfollowChannel } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFollowChannel: vi.fn(),
  mockUnfollowChannel: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/server/application/wiring', () => ({
  useCases: {
    channels: { follow: mockFollowChannel, unfollow: mockUnfollowChannel },
  },
}));

import { POST, DELETE } from '../route';

const session = { user: { id: 'user1' } };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('POST /api/channels/:id/follow', () => {
  const followData = {
    channelName: 'Test Channel',
    channelThumbnail: 'https://img.example.com/avatar.jpg',
    subscriberCount: '1.2M',
  };

  it('follows a channel and returns 201', async () => {
    const followed = { channelId: 'ch1', ...followData, followedAt: '2024-01-01' };
    mockFollowChannel.mockReturnValue(followed);

    const result = await POST(
      new Request('http://localhost/api/channels/ch1/follow', {
        method: 'POST',
        body: JSON.stringify(followData),
      }),
      { params: Promise.resolve({ id: 'ch1' }) },
    );

    expect(result.status).toBe(201);
    expect(result.body).toEqual(followed);
    expect(mockFollowChannel).toHaveBeenCalledWith('user1', {
      channelId: 'ch1',
      channelName: 'Test Channel',
      channelThumbnail: 'https://img.example.com/avatar.jpg',
      subscriberCount: '1.2M',
    });
  });

  it('uses default empty thumbnail when omitted', async () => {
    mockFollowChannel.mockReturnValue({ channelId: 'ch1' });

    await POST(
      new Request('http://localhost/api/channels/ch1/follow', {
        method: 'POST',
        body: JSON.stringify({ channelName: 'Test Channel' }),
      }),
      { params: Promise.resolve({ id: 'ch1' }) },
    );

    expect(mockFollowChannel).toHaveBeenCalledWith('user1', {
      channelId: 'ch1',
      channelName: 'Test Channel',
      channelThumbnail: '',
      subscriberCount: undefined,
    });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await POST(
      new Request('http://localhost/api/channels/ch1/follow', {
        method: 'POST',
        body: JSON.stringify(followData),
      }),
      { params: Promise.resolve({ id: 'ch1' }) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 400 for empty channel_name', async () => {
    const result = await POST(
      new Request('http://localhost/api/channels/ch1/follow', {
        method: 'POST',
        body: JSON.stringify({ channelName: '' }),
      }),
      { params: Promise.resolve({ id: 'ch1' }) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 400 for invalid thumbnail url', async () => {
    const result = await POST(
      new Request('http://localhost/api/channels/ch1/follow', {
        method: 'POST',
        body: JSON.stringify({ channelName: 'Test', channelThumbnail: 'not-a-url' }),
      }),
      { params: Promise.resolve({ id: 'ch1' }) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockFollowChannel.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await POST(
      new Request('http://localhost/api/channels/ch1/follow', {
        method: 'POST',
        body: JSON.stringify(followData),
      }),
      { params: Promise.resolve({ id: 'ch1' }) },
    );

    expect(result.status).toBe(500);
  });
});

describe('DELETE /api/channels/:id/follow', () => {
  it('unfollows a channel and returns success', async () => {
    mockUnfollowChannel.mockReturnValue(true);

    const result = await DELETE(
      new Request('http://localhost/api/channels/ch1/follow'),
      { params: Promise.resolve({ id: 'ch1' }) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ success: true });
    expect(mockUnfollowChannel).toHaveBeenCalledWith('user1', 'ch1');
  });

  it('returns 404 when not following the channel', async () => {
    mockUnfollowChannel.mockReturnValue(false);

    const result = await DELETE(
      new Request('http://localhost/api/channels/ch1/follow'),
      { params: Promise.resolve({ id: 'ch1' }) },
    );

    expect(result.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await DELETE(
      new Request('http://localhost/api/channels/ch1/follow'),
      { params: Promise.resolve({ id: 'ch1' }) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 500 on unexpected error', async () => {
    mockUnfollowChannel.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await DELETE(
      new Request('http://localhost/api/channels/ch1/follow'),
      { params: Promise.resolve({ id: 'ch1' }) },
    );

    expect(result.status).toBe(500);
  });
});
