// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockGetAllFolders, mockCreateFolder } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetAllFolders: vi.fn(),
  mockCreateFolder: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/auth', () => ({ auth: mockAuth }));
vi.mock('@/server/application/wiring', () => ({
  useCases: {
    folders: { getAll: mockGetAllFolders, create: mockCreateFolder },
  },
}));

import * as route from '../route';

type Handler = (...args: unknown[]) => Promise<{ body: Record<string, any>; status: number }>;

const GET = route.GET as unknown as Handler;
const POST = route.POST as unknown as Handler;

const session = { user: { id: 'user1' } };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('GET /api/folders', () => {
  it('returns all folders', async () => {
    mockGetAllFolders.mockResolvedValue([{ id: 'f-1', name: 'Folder 1' }]);

    const result = await GET(new Request('http://localhost/api/folders'));

    expect(result.status).toBe(200);
    expect(result.body).toHaveLength(1);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await GET(new Request('http://localhost/api/folders'));

    expect(result.status).toBe(401);
  });
});

describe('POST /api/folders', () => {
  it('creates a folder', async () => {
    mockCreateFolder.mockResolvedValue({ id: 'f-1', name: 'New Folder', sortOrder: 0, createdAt: '2025-01-01' });

    const result = await POST(
      new Request('http://localhost/api/folders', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Folder' }),
      }),
    );

    expect(result.status).toBe(201);
    expect(result.body.name).toBe('New Folder');
  });

  it('returns 400 for empty name', async () => {
    const result = await POST(
      new Request('http://localhost/api/folders', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
      }),
    );

    expect(result.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await POST(
      new Request('http://localhost/api/folders', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      }),
    );

    expect(result.status).toBe(401);
  });
});
