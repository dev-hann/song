// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockGetStatus } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetStatus: vi.fn(),
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
    onboarding: { getStatus: mockGetStatus },
  },
}));

import { GET } from '../route';

const session = { user: { id: 'user1' } };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('GET /api/onboarding/status', () => {
  it('returns needsOnboarding true for new user', async () => {
    mockGetStatus.mockResolvedValue(true);

    const result = await GET(new Request('http://localhost/api/onboarding/status'), { params: Promise.resolve({}) });

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ needsOnboarding: true });
    expect(mockGetStatus).toHaveBeenCalledWith('user1');
  });

  it('returns needsOnboarding false for completed user', async () => {
    mockGetStatus.mockResolvedValue(false);

    const result = await GET(new Request('http://localhost/api/onboarding/status'), { params: Promise.resolve({}) });

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ needsOnboarding: false });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await GET(new Request('http://localhost/api/onboarding/status'), { params: Promise.resolve({}) });

    expect(result.status).toBe(401);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetStatus.mockRejectedValue(new Error('DB fail'));

    const result = await GET(new Request('http://localhost/api/onboarding/status'), { params: Promise.resolve({}) });

    expect(result.status).toBe(500);
  });
});
