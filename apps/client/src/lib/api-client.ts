const USER_KEY = 'song_user';

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function clearAuth() {
  accessToken = null;
  localStorage.removeItem(USER_KEY);
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'same-origin',
      });

      if (!response.ok) return null;

      const data = await response.json();
      accessToken = data.token;
      return accessToken;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      return fetch(url, { ...options, headers });
    }

    clearAuth();
    window.dispatchEvent(new Event('song:auth-expired'));
  }

  return response;
}
