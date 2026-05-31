// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockReportError } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockReportError: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/server/services/error-reporter', () => ({
  reportError: mockReportError,
}));

import { POST } from '../route';

const session = { user: { id: 'user1' } };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
  mockReportError.mockResolvedValue(undefined);
});

describe('POST /api/errors', () => {
  it('reports error and returns success', async () => {
    const errorData = {
      message: 'Something went wrong',
      stack: 'Error at line 1',
      route: '/api/test',
      metadata: { key: 'value' },
    };

    const result = await POST(
      new Request('http://localhost/api/errors', {
        method: 'POST',
        body: JSON.stringify(errorData),
        headers: { 'user-agent': 'TestAgent/1.0' },
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ success: true });
    expect(mockReportError).toHaveBeenCalledWith(
      { message: 'Something went wrong', stack: 'Error at line 1' },
      {
        source: 'client',
        route: '/api/test',
        method: 'CLIENT',
        userAgent: 'TestAgent/1.0',
        metadata: { key: 'value' },
      },
    );
  });

  it('works with minimal required fields', async () => {
    const result = await POST(
      new Request('http://localhost/api/errors', {
        method: 'POST',
        body: JSON.stringify({ message: 'Error occurred' }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(200);
    expect(mockReportError).toHaveBeenCalledWith(
      { message: 'Error occurred', stack: undefined },
      expect.objectContaining({ source: 'client' }),
    );
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await POST(
      new Request('http://localhost/api/errors', {
        method: 'POST',
        body: JSON.stringify({ message: 'Error' }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 400 for empty message', async () => {
    const result = await POST(
      new Request('http://localhost/api/errors', {
        method: 'POST',
        body: JSON.stringify({ message: '' }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 400 for missing message', async () => {
    const result = await POST(
      new Request('http://localhost/api/errors', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 500 on reporter error', async () => {
    mockReportError.mockRejectedValue(new Error('reporter fail'));

    const result = await POST(
      new Request('http://localhost/api/errors', {
        method: 'POST',
        body: JSON.stringify({ message: 'Error' }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(500);
  });
});
