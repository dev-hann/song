export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  if (response.status === 401) {
    window.dispatchEvent(new Event('song:auth-expired'));
  }

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    throw new ApiError(
      response.status,
      body,
      `API Error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}
