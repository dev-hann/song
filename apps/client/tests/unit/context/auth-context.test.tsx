import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/auth-context';

vi.mock('@/lib/api-client', () => ({
  setAccessToken: vi.fn(),
  clearAuth: vi.fn(),
}));

import { setAccessToken, clearAuth } from '@/lib/api-client';

const mockSetAccessToken = vi.mocked(setAccessToken);
const mockClearAuth = vi.mocked(clearAuth);

const mockUser = {
  id: 'user-1',
  email: 'test@test.com',
  name: 'Test User',
  picture: 'https://example.com/pic.jpg',
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  function renderAuthHook() {
    return renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });
  }

  it('initializes user from localStorage', () => {
    localStorage.setItem('song_user', JSON.stringify(mockUser));

    const { result } = renderAuthHook();

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('initializes with null user when localStorage is empty', () => {
    const { result } = renderAuthHook();

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('setAuth sets token and user, saves to localStorage', () => {
    const { result } = renderAuthHook();

    act(() => {
      result.current.setAuth('access-token-123', mockUser);
    });

    expect(mockSetAccessToken).toHaveBeenCalledWith('access-token-123');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(JSON.parse(localStorage.getItem('song_user')!)).toEqual(mockUser);
  });

  it('logout calls /api/auth/logout, clears auth, sets user to null', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    localStorage.setItem('song_user', JSON.stringify(mockUser));

    const { result } = renderAuthHook();
    expect(result.current.user).toEqual(mockUser);

    await act(async () => {
      await result.current.logout();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
    expect(mockClearAuth).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);

    vi.restoreAllMocks();
  });

  it('useAuth throws when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within AuthProvider');
  });

  it('isAuthenticated is true when user exists', () => {
    localStorage.setItem('song_user', JSON.stringify(mockUser));

    const { result } = renderAuthHook();

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('isAuthenticated is false when user is null', () => {
    const { result } = renderAuthHook();

    expect(result.current.isAuthenticated).toBe(false);
  });
});
