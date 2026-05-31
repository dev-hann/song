// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockGetAllLikes, mockAddLike } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetAllLikes: vi.fn(),
  mockAddLike: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/server/models/like', () => ({
  getAllLikes: mockGetAllLikes,
  addLike: mockAddLike,
}));

import { GET, POST } from '../route';

const session = { user: { id: 'user1' } };
const likes = [
  { videoId: 'vid1', title: 'Song 1', channel: 'Artist 1', thumbnail: '', duration: 200, createdAt: '2024-01-01' },
  { videoId: 'vid2', title: 'Song 2', channel: 'Artist 2', thumbnail: '', duration: 180, createdAt: '2024-01-02' },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('GET /api/likes', () => {
  it('returns all likes for authenticated user', async () => {
    mockGetAllLikes.mockReturnValue(likes);

    const result = await GET(new Request('http://localhost/api/likes'), { params: Promise.resolve({}) });

    expect(result.status).toBe(200);
    expect(result.body).toEqual(likes);
    expect(mockGetAllLikes).toHaveBeenCalledWith('user1');
  });

  it('returns empty array when no likes', async () => {
    mockGetAllLikes.mockReturnValue([]);

    const result = await GET(new Request('http://localhost/api/likes'), { params: Promise.resolve({}) });

    expect(result.status).toBe(200);
    expect(result.body).toEqual([]);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await GET(new Request('http://localhost/api/likes'), { params: Promise.resolve({}) });

    expect(result.status).toBe(401);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetAllLikes.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await GET(new Request('http://localhost/api/likes'), { params: Promise.resolve({}) });

    expect(result.status).toBe(500);
  });
});

describe('POST /api/likes', () => {
  const likeData = {
    videoId: 'vid1',
    title: 'Test Song',
    channel: 'Test Artist',
    thumbnail: 'https://img.example.com/thumb.jpg',
    duration: 200,
  };

  it('adds a like and returns 201', async () => {
    const added = { ...likeData, createdAt: '2024-01-01' };
    mockAddLike.mockReturnValue(added);

    const result = await POST(
      new Request('http://localhost/api/likes', {
        method: 'POST',
        body: JSON.stringify(likeData),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(201);
    expect(result.body).toEqual(added);
    expect(mockAddLike).toHaveBeenCalledWith('user1', likeData);
  });

  it('uses defaults for omitted optional fields', async () => {
    const minimal = { videoId: 'vid1', title: 'Test Song' };
    mockAddLike.mockReturnValue({ ...minimal, channel: '', thumbnail: '', duration: 0 });

    await POST(
      new Request('http://localhost/api/likes', {
        method: 'POST',
        body: JSON.stringify(minimal),
      }),
      { params: Promise.resolve({}) },
    );

    expect(mockAddLike).toHaveBeenCalledWith('user1', {
      videoId: 'vid1',
      title: 'Test Song',
      channel: '',
      thumbnail: '',
      duration: 0,
    });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await POST(
      new Request('http://localhost/api/likes', {
        method: 'POST',
        body: JSON.stringify(likeData),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 400 for missing video_id', async () => {
    const result = await POST(
      new Request('http://localhost/api/likes', {
        method: 'POST',
        body: JSON.stringify({ ...likeData, videoId: '' }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 400 for missing title', async () => {
    const result = await POST(
      new Request('http://localhost/api/likes', {
        method: 'POST',
        body: JSON.stringify({ ...likeData, title: '' }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockAddLike.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await POST(
      new Request('http://localhost/api/likes', {
        method: 'POST',
        body: JSON.stringify(likeData),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(500);
  });
});
