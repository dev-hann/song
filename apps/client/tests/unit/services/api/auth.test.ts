import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyCredential } from '@/services/api/auth';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';

describe('verifyCredential', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns auth data on success', async () => {
    const mockResponse = {
      registered: true,
      token: 'jwt-token',
      user: { id: '1', email: 'test@test.com', name: 'Test' },
    };
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await verifyCredential('google-credential');
    expect(result).toEqual(mockResponse);
    expect(apiFetch).toHaveBeenCalledWith('/api/auth/verify', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ credential: 'google-credential' }),
    }));
  });

  it('throws with error message on failure', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid credential' }),
    } as Response);

    await expect(verifyCredential('bad')).rejects.toThrow('Invalid credential');
  });
});
