// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockUpdateFolder, mockDeleteFolder } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockUpdateFolder: vi.fn(),
  mockDeleteFolder: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/auth', () => ({ auth: mockAuth }));
vi.mock('@/server/application/wiring', () => ({
  useCases: {
    folders: { update: mockUpdateFolder, delete: mockDeleteFolder },
  },
}));

import { PATCH, DELETE } from '../route';

const session = { user: { id: 'user1' } };

type MockResponse = { body: Record<string, any>; status: number };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('PATCH /api/folders/:id', () => {
  it('updates folder name', async () => {
    mockUpdateFolder.mockResolvedValue({ id: 'f-1', name: 'Renamed', sortOrder: 0, createdAt: '2025-01-01' });

    const result = await PATCH(
      new Request('http://localhost/api/folders/f-1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Renamed' }),
      }),
      { params: Promise.resolve({ id: 'f-1' }) },
    ) as unknown as MockResponse;

    expect(result.status).toBe(200);
    expect(result.body.name).toBe('Renamed');
  });

  it('returns 404 when folder not found', async () => {
    mockUpdateFolder.mockResolvedValue(null);

    const result = await PATCH(
      new Request('http://localhost/api/folders/missing', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Test' }),
      }),
      { params: Promise.resolve({ id: 'missing' }) },
    ) as unknown as MockResponse;

    expect(result.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await PATCH(
      new Request('http://localhost/api/folders/f-1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Test' }),
      }),
      { params: Promise.resolve({ id: 'f-1' }) },
    ) as unknown as MockResponse;

    expect(result.status).toBe(401);
  });
});

describe('DELETE /api/folders/:id', () => {
  it('deletes folder', async () => {
    mockDeleteFolder.mockResolvedValue(true);

    const result = await DELETE(
      new Request('http://localhost/api/folders/f-1'),
      { params: Promise.resolve({ id: 'f-1' }) },
    ) as unknown as MockResponse;

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ success: true });
  });

  it('returns 404 when folder not found', async () => {
    mockDeleteFolder.mockResolvedValue(false);

    const result = await DELETE(
      new Request('http://localhost/api/folders/missing'),
      { params: Promise.resolve({ id: 'missing' }) },
    ) as unknown as MockResponse;

    expect(result.status).toBe(404);
  });
});
