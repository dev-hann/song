// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockSelect: ReturnType<typeof vi.fn>;
let mockFrom: ReturnType<typeof vi.fn>;
let mockWhere: ReturnType<typeof vi.fn>;
let mockInsert: ReturnType<typeof vi.fn>;
let mockValues: ReturnType<typeof vi.fn>;
let mockUpdate: ReturnType<typeof vi.fn>;
let mockSet: ReturnType<typeof vi.fn>;

let mockDb: Record<string, unknown>;

vi.mock('@/server/db', () => ({
  get db() { return mockDb; },
}));

vi.mock('@/server/db/schema', () => ({
  users: { id: 'id', email: 'email', name: 'name', picture: 'picture' },
}));

const userRow = {
  id: 'usr_abc123',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'pic.jpg',
  registeredAt: '2024-01-01 00:00:00',
  lastLogin: '2024-01-01 00:00:00',
  isActive: true,
};

beforeEach(() => {
  mockSelect = vi.fn().mockReturnThis();
  mockFrom = vi.fn().mockReturnThis();
  mockWhere = vi.fn().mockReturnThis();
  mockInsert = vi.fn().mockReturnThis();
  mockValues = vi.fn().mockReturnThis();
  mockUpdate = vi.fn().mockReturnThis();
  mockSet = vi.fn().mockReturnThis();

  mockDb = {
    select: mockSelect,
    from: mockFrom,
    where: mockWhere,
    insert: mockInsert,
    values: mockValues,
    update: mockUpdate,
    set: mockSet,
  };
});

describe('userRepository', () => {
  it('findByEmail — returns user when found', async () => {
    mockWhere.mockResolvedValueOnce([userRow]);
    const { userRepository } = await import('../user.repository');
    const result = await userRepository.findByEmail('test@example.com');
    expect(result).toBeDefined();
    expect(result?.email).toBe('test@example.com');
  });

  it('findByEmail — returns undefined when not found', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const { userRepository } = await import('../user.repository');
    const result = await userRepository.findByEmail('nobody@example.com');
    expect(result).toBeUndefined();
  });

  it('findById — returns user when found', async () => {
    mockWhere.mockResolvedValueOnce([userRow]);
    const { userRepository } = await import('../user.repository');
    const result = await userRepository.findById('usr_abc123');
    expect(result).toBeDefined();
    expect(result?.id).toBe('usr_abc123');
  });

  it('findById — returns undefined when not found', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const { userRepository } = await import('../user.repository');
    const result = await userRepository.findById('nonexistent');
    expect(result).toBeUndefined();
  });

  it('create — inserts and returns user', async () => {
    mockValues.mockResolvedValueOnce(undefined);
    mockWhere.mockResolvedValueOnce([userRow]);
    const { userRepository } = await import('../user.repository');
    const result = await userRepository.create({
      email: 'test@example.com',
      name: 'Test User',
      picture: 'pic.jpg',
    });
    expect(result.id).toMatch(/^usr_/);
    expect(result.email).toBe('test@example.com');
  });

  it('create — defaults picture to empty string', async () => {
    const rowNoPic = { ...userRow, picture: '' };
    mockValues.mockResolvedValueOnce(undefined);
    mockWhere.mockResolvedValueOnce([rowNoPic]);
    const { userRepository } = await import('../user.repository');
    const result = await userRepository.create({
      email: 'test@example.com',
      name: 'Test User',
    });
    expect(result.picture).toBe('');
  });

  it('updateLastLogin — updates user lastLogin', async () => {
    mockUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    const { userRepository } = await import('../user.repository');
    await userRepository.updateLastLogin('usr_abc123');
    expect(mockUpdate).toHaveBeenCalled();
  });
});
