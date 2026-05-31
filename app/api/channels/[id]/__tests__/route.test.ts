// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockGetInnertube, mockIsFollowing } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetInnertube: vi.fn(),
  mockIsFollowing: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/server/services/youtube', () => ({
  getInnertube: mockGetInnertube,
}));

vi.mock('@/server/models/channel', () => ({
  isFollowing: mockIsFollowing,
}));

import { GET } from '../route';

type MockResponse = { body: Record<string, any>; status: number };

const session = { user: { id: 'user1' } };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
  mockIsFollowing.mockReturnValue(false);
});

function makeMockChannel(videos: Record<string, unknown>[] = []) {
  return {
    videos,
    metadata: {
      title: 'Test Channel',
      avatar: [{ url: 'https://img.example.com/avatar.jpg' }],
      subscriberCount: '1.2M',
    },
  };
}

describe('GET /api/channels/:id', () => {
  it('returns channel info with videos', async () => {
    const mockChannel = makeMockChannel([
      {
        id: 'vid1',
        title: 'Video 1',
        thumbnails: [{ url: 'https://img.example.com/thumb.jpg' }],
        duration: { seconds: 200 },
        author: { name: 'Test Channel', thumbnails: [{ url: 'https://img.example.com/avatar.jpg' }] },
      },
    ]);
    const mockInnertube = { getChannel: vi.fn().mockResolvedValue(mockChannel) };
    mockGetInnertube.mockResolvedValue(mockInnertube);

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
    expect(result.body.videos[0]).toEqual({
      id: 'vid1',
      title: 'Video 1',
      thumbnail: 'https://img.example.com/thumb.jpg',
      duration: 200,
      channel: { name: 'Test Channel', thumbnail: 'https://img.example.com/avatar.jpg' },
    });
  });

  it('handles video id as object with video_id', async () => {
    const mockChannel = makeMockChannel([
      {
        id: { videoId: 'vidObj1' },
        title: { text: 'Obj Title' },
        thumbnails: [{ url: 'https://img.example.com/thumb.jpg' }],
        duration: { seconds: 100 },
        author: { name: 'Test', thumbnails: [{ url: 'https://img.example.com/avatar.jpg' }] },
      },
    ]);
    const mockInnertube = { getChannel: vi.fn().mockResolvedValue(mockChannel) };
    mockGetInnertube.mockResolvedValue(mockInnertube);

    const result = (await GET(
      new Request('http://localhost/api/channels/ch1'),
      { params: Promise.resolve({ id: 'ch1' }) },
    )) as unknown as MockResponse;

    expect(result.body.videos[0].id).toBe('vidObj1');
    expect(result.body.videos[0].title).toBe('Obj Title');
  });

  it('skips videos with empty id', async () => {
    const mockChannel = makeMockChannel([
      { id: '', title: 'No ID' },
      { id: undefined, title: 'Undefined ID' },
    ]);
    const mockInnertube = { getChannel: vi.fn().mockResolvedValue(mockChannel) };
    mockGetInnertube.mockResolvedValue(mockInnertube);

    const result = (await GET(
      new Request('http://localhost/api/channels/ch1'),
      { params: Promise.resolve({ id: 'ch1' }) },
    )) as unknown as MockResponse;

    expect(result.body.videos).toHaveLength(0);
  });

  it('returns following true when user follows channel', async () => {
    mockIsFollowing.mockReturnValue(true);
    const mockInnertube = { getChannel: vi.fn().mockResolvedValue(makeMockChannel()) };
    mockGetInnertube.mockResolvedValue(mockInnertube);

    const result = (await GET(
      new Request('http://localhost/api/channels/ch1'),
      { params: Promise.resolve({ id: 'ch1' }) },
    )) as unknown as MockResponse;

    expect(result.body.following).toBe(true);
  });

  it('returns following false when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const mockInnertube = { getChannel: vi.fn().mockResolvedValue(makeMockChannel()) };
    mockGetInnertube.mockResolvedValue(mockInnertube);

    const result = (await GET(
      new Request('http://localhost/api/channels/ch1'),
      { params: Promise.resolve({ id: 'ch1' }) },
    )) as unknown as MockResponse;

    expect(result.body.following).toBe(false);
  });

  it('returns empty videos when channel has no videos', async () => {
    const mockChannel = { metadata: { title: 'Empty Channel' } };
    const mockInnertube = { getChannel: vi.fn().mockResolvedValue(mockChannel) };
    mockGetInnertube.mockResolvedValue(mockInnertube);

    const result = (await GET(
      new Request('http://localhost/api/channels/ch1'),
      { params: Promise.resolve({ id: 'ch1' }) },
    )) as unknown as MockResponse;

    expect(result.body.videos).toEqual([]);
  });

  it('returns 500 on youtube api error', async () => {
    mockGetInnertube.mockRejectedValue(new Error('youtube down'));

    const result = await GET(
      new Request('http://localhost/api/channels/ch1'),
      { params: Promise.resolve({ id: 'ch1' }) },
    );

    expect(result.status).toBe(500);
  });
});
