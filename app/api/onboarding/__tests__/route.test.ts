// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockComplete } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockComplete: vi.fn(),
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
    onboarding: { complete: mockComplete },
  },
}));

import { POST } from '../route';

const session = { user: { id: 'user1' } };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('POST /api/onboarding', () => {
  it('completes onboarding with selected artists', async () => {
    mockComplete.mockResolvedValue(undefined);

    const result = await POST(
      new Request('http://localhost/api/onboarding', {
        method: 'POST',
        body: JSON.stringify({ artistNames: ['IU', 'BTS'] }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ success: true });
    expect(mockComplete).toHaveBeenCalledWith('user1', ['IU', 'BTS']);
  });

  it('completes onboarding with empty array (skip)', async () => {
    mockComplete.mockResolvedValue(undefined);

    const result = await POST(
      new Request('http://localhost/api/onboarding', {
        method: 'POST',
        body: JSON.stringify({ artistNames: [] }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ success: true });
    expect(mockComplete).toHaveBeenCalledWith('user1', []);
  });

  it('returns 400 for invalid body', async () => {
    const result = await POST(
      new Request('http://localhost/api/onboarding', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 400 for too many artists', async () => {
    const artists = Array.from({ length: 21 }, (_, i) => `Artist ${i}`);
    const result = await POST(
      new Request('http://localhost/api/onboarding', {
        method: 'POST',
        body: JSON.stringify({ artistNames: artists }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 400 for empty string artist name', async () => {
    const result = await POST(
      new Request('http://localhost/api/onboarding', {
        method: 'POST',
        body: JSON.stringify({ artistNames: [''] }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await POST(
      new Request('http://localhost/api/onboarding', {
        method: 'POST',
        body: JSON.stringify({ artistNames: ['IU'] }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 500 on unexpected error', async () => {
    mockComplete.mockRejectedValue(new Error('DB fail'));

    const result = await POST(
      new Request('http://localhost/api/onboarding', {
        method: 'POST',
        body: JSON.stringify({ artistNames: ['IU'] }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(500);
  });
});
