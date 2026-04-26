import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAccessToken, setAccessToken, clearAuth, apiFetch } from '@/lib/api-client';

describe('api-client', () => {
  beforeEach(() => {
    clearAuth();
    vi.restoreAllMocks();
  });

  describe('getAccessToken / setAccessToken / clearAuth', () => {
    it('returns null initially', () => {
      expect(getAccessToken()).toBeNull();
    });

    it('returns token after setAccessToken', () => {
      setAccessToken('test-token');
      expect(getAccessToken()).toBe('test-token');
    });

    it('clears token and localStorage on clearAuth', () => {
      setAccessToken('test-token');
      localStorage.setItem('song_user', '{"id":"1"}');
      clearAuth();
      expect(getAccessToken()).toBeNull();
      expect(localStorage.getItem('song_user')).toBeNull();
    });
  });

  describe('apiFetch', () => {
    it('adds Authorization header when token is set', async () => {
      setAccessToken('my-token');
      const mockResponse = new Response('{}', { status: 200 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

      await apiFetch('/api/test');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
        }),
      );
    });

    it('returns response when ok', async () => {
      const mockResponse = new Response('{"data":1}', { status: 200 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse);

      const result = await apiFetch('/api/test');
      expect(result).toBe(mockResponse);
    });

    it('tries to refresh token on 401 and retries with new token', async () => {
      setAccessToken('old-token');

      const response401 = new Response('{}', { status: 401 });
      const refreshedResponse = new Response('{"data":"ok"}', { status: 200 });

      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(response401)
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ token: 'new-token' }), { status: 200 }),
        )
        .mockResolvedValueOnce(refreshedResponse);

      const result = await apiFetch('/api/test');

      expect(globalThis.fetch).toHaveBeenCalledTimes(3);
      expect(result).toBe(refreshedResponse);
      expect(getAccessToken()).toBe('new-token');
    });

    it('clears auth and dispatches event when refresh fails', async () => {
      setAccessToken('old-token');
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      const response401 = new Response('{}', { status: 401 });
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(response401)
        .mockResolvedValueOnce(new Response('{}', { status: 401 }));

      await apiFetch('/api/test');

      expect(getAccessToken()).toBeNull();
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'song:auth-expired' }));
    });
  });
});
