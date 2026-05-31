import { vi, describe, it, expect, afterEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

import { apiFetch, ApiError } from '@/lib/api-client';

describe('apiFetch', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns parsed JSON on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 1, name: 'test' }),
    });

    const result = await apiFetch<{ id: number; name: string }>('/api/test');

    expect(result).toEqual({ id: 1, name: 'test' });
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({}),
    });

    await expect(apiFetch('/api/missing')).rejects.toThrow('API Error: 404');
  });

  it('throws on 500 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({}),
    });

    await expect(apiFetch('/api/broken')).rejects.toThrow('API Error: 500');
  });

  it('dispatches auth-expired event on 401', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({}),
    });

    await expect(apiFetch('/api/protected')).rejects.toThrow();

    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    expect(dispatchSpy.mock.calls[0][0].type).toBe('song:auth-expired');

    dispatchSpy.mockRestore();
  });

  it('includes credentials', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await apiFetch('/api/test');

    const request = mockFetch.mock.calls[0][0] as Request;
    expect(request.url).toContain('/api/test');
    expect(request.credentials).toBe('include');
  });

  it('throws ApiError with status and body on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      json: () => Promise.resolve({ error: 'Track already in playlist' }),
    });

    try {
      await apiFetch('/api/test');
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(409);
        expect(error.body).toEqual({ error: 'Track already in playlist' });
      }
    }
  });

  it('ApiError extends Error', () => {
    const error = new ApiError(409, { error: 'test' }, 'API Error: 409 Conflict');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.body).toEqual({ error: 'test' });
    expect(error.message).toBe('API Error: 409 Conflict');
  });
});
