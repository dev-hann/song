// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('../../auth', () => ({
  auth: mockAuth,
}));

import { requireAuth, validateBody, handleErrors } from '../route-helpers';

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns session when authenticated', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } });

    const { session, error } = await requireAuth();

    expect(session).toEqual({ user: { id: 'user1' } });
    expect(error).toBeNull();
  });

  it('returns 401 error when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const { session, error } = await requireAuth();

    expect(session).toBeNull();
    expect(error).not.toBeNull();
  });

  it('returns 401 error when session has no user id', async () => {
    mockAuth.mockResolvedValueOnce({ user: {} });

    const { session, error } = await requireAuth();

    expect(session).toBeNull();
    expect(error).not.toBeNull();
  });
});

describe('validateBody', () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().positive(),
  });

  it('returns parsed data on valid input', () => {
    const { data, error } = validateBody(schema, { name: 'Test', age: 25 });

    expect(data).toEqual({ name: 'Test', age: 25 });
    expect(error).toBeNull();
  });

  it('returns 400 error on invalid input', () => {
    const { data, error } = validateBody(schema, { name: '', age: -1 });

    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });
});

describe('handleErrors', () => {
  it('catches exceptions and returns 500', async () => {
    const handler = vi.fn().mockRejectedValueOnce(new Error('boom'));
    const wrapped = handleErrors(handler);

    const result = await wrapped(
      new Request('http://localhost/test'),
      { params: Promise.resolve({ id: '1' }) },
    );

    expect(result.status).toBe(500);
  });

  it('passes through successful responses', async () => {
    const successResponse = { body: { ok: true }, status: 200 };
    const handler = vi.fn().mockResolvedValueOnce(successResponse);
    const wrapped = handleErrors(handler);

    const result = await wrapped(
      new Request('http://localhost/test'),
      { params: Promise.resolve({}) },
    );

    expect(result).toEqual(successResponse);
  });
});
