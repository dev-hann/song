// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockGetRecentHistory, mockAddToHistory, mockClearHistory } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetRecentHistory: vi.fn(),
  mockAddToHistory: vi.fn(),
  mockClearHistory: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/server/models/history', () => ({
  getRecentHistory: mockGetRecentHistory,
  addToHistory: mockAddToHistory,
  clearHistory: mockClearHistory,
}));

import { GET, POST, DELETE } from '../route';

const session = { user: { id: 'user1' } };
const historyItems = [
  { videoId: 'vid1', title: 'Song 1', channel: 'Artist 1', thumbnail: '', duration: 200, playedAt: '2024-01-01' },
  { videoId: 'vid2', title: 'Song 2', channel: 'Artist 2', thumbnail: '', duration: 180, playedAt: '2024-01-02' },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('GET /api/history', () => {
  it('returns recent history with default limit', async () => {
    mockGetRecentHistory.mockReturnValue(historyItems);

    const result = await GET(
      new Request('http://localhost/api/history'),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual(historyItems);
    expect(mockGetRecentHistory).toHaveBeenCalledWith('user1', 100);
  });

  it('respects custom limit query parameter', async () => {
    mockGetRecentHistory.mockReturnValue([]);

    const result = await GET(
      new Request('http://localhost/api/history?limit=50'),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(200);
    expect(mockGetRecentHistory).toHaveBeenCalledWith('user1', 50);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await GET(
      new Request('http://localhost/api/history'),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 400 for limit exceeding 500', async () => {
    const result = await GET(
      new Request('http://localhost/api/history?limit=501'),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 400 for zero limit', async () => {
    const result = await GET(
      new Request('http://localhost/api/history?limit=0'),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetRecentHistory.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await GET(
      new Request('http://localhost/api/history'),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(500);
  });
});

describe('POST /api/history', () => {
  const historyData = {
    videoId: 'vid1',
    title: 'Test Song',
    channel: 'Test Artist',
    thumbnail: 'https://img.example.com/thumb.jpg',
    duration: 200,
  };

  it('adds to history and returns 201', async () => {
    mockAddToHistory.mockReturnValue(undefined);

    const result = await POST(
      new Request('http://localhost/api/history', {
        method: 'POST',
        body: JSON.stringify(historyData),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(201);
    expect(result.body).toEqual({ success: true });
    expect(mockAddToHistory).toHaveBeenCalledWith('user1', historyData);
  });

  it('uses defaults for omitted optional fields', async () => {
    const minimal = { videoId: 'vid1', title: 'Test Song' };
    mockAddToHistory.mockReturnValue(undefined);

    await POST(
      new Request('http://localhost/api/history', {
        method: 'POST',
        body: JSON.stringify(minimal),
      }),
      { params: Promise.resolve({}) },
    );

    expect(mockAddToHistory).toHaveBeenCalledWith('user1', {
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
      new Request('http://localhost/api/history', {
        method: 'POST',
        body: JSON.stringify(historyData),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 400 for missing video_id', async () => {
    const result = await POST(
      new Request('http://localhost/api/history', {
        method: 'POST',
        body: JSON.stringify({ ...historyData, videoId: '' }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 400 for missing title', async () => {
    const result = await POST(
      new Request('http://localhost/api/history', {
        method: 'POST',
        body: JSON.stringify({ ...historyData, title: '' }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockAddToHistory.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await POST(
      new Request('http://localhost/api/history', {
        method: 'POST',
        body: JSON.stringify(historyData),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(500);
  });
});

describe('DELETE /api/history', () => {
  it('clears history and returns success', async () => {
    mockClearHistory.mockReturnValue(undefined);

    const result = await DELETE(
      new Request('http://localhost/api/history'),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ success: true });
    expect(mockClearHistory).toHaveBeenCalledWith('user1');
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await DELETE(
      new Request('http://localhost/api/history'),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 500 on unexpected error', async () => {
    mockClearHistory.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await DELETE(
      new Request('http://localhost/api/history'),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(500);
  });
});
