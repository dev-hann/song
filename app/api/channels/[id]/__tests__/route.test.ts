// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockGetChannel } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetChannel: vi.fn(),
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
    channels: { get: mockGetChannel },
  },
}));

vi.mock('@/server/application/schemas/response', () => ({
  ChannelResponseSchema: { parse: (v: unknown) => v },
}));

import { GET } from '../route';

type MockResponse = { body: Record<string, any>; status: number };

const session = { user: { id: 'user1' } };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('GET /api/channels/:id', () => {
  it('returns channel info with videos', async () => {
    const channelData = {
      id: 'ch1',
      name: 'Test Channel',
      thumbnail: 'https://img.example.com/avatar.jpg',
      subscriberCount: '1.2M',
      following: false,
      videos: [
        {
          id: 'vid1',
          title: 'Video 1',
          thumbnail: 'https://img.example.com/thumb.jpg',
          duration: 200,
          channel: { name: 'Test Channel', thumbnail: 'https://img.example.com/avatar.jpg' },
        },
      ],
    };
    mockGetChannel.mockResolvedValue(channelData);

    const result = (await GET(
      new Request('http://localhost/api/channels/ch1'),
      { params: Promise.resolve({ id: 'ch1' }) },
    )) as unknown as MockResponse;

    expect(result.status).toBe(200);
    expect(result.body.id).toBe('ch1');
    expect(result.body.name).toBe('Test Channel');
    expect(result.body.thumbnail).toBe('https://img.example.com/avatar.jpg');
    expect(result.body.subscriberCount).toBe('1.2M');
    expect(result.body.following).toBe(false);
    expect(result.body.videos).toHaveLength(1);
    expect(mockGetChannel).toHaveBeenCalledWith('user1', 'ch1');
  });

  it('returns following true when user follows channel', async () => {
    mockGetChannel.mockResolvedValue({
      id: 'ch1', name: 'Test', following: true, videos: [],
    });

    const result = (await GET(
      new Request('http://localhost/api/channels/ch1'),
      { params: Promise.resolve({ id: 'ch1' }) },
    )) as unknown as MockResponse;

    expect(result.body.following).toBe(true);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await GET(
      new Request('http://localhost/api/channels/ch1'),
      { params: Promise.resolve({ id: 'ch1' }) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 500 on use case error', async () => {
    mockGetChannel.mockRejectedValue(new Error('youtube down'));

    const result = await GET(
      new Request('http://localhost/api/channels/ch1'),
      { params: Promise.resolve({ id: 'ch1' }) },
    );

    expect(result.status).toBe(500);
  });
});
