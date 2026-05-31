// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockDb } = vi.hoisted(() => {
  const self: Record<string, ReturnType<typeof vi.fn>> = {};
  self.select = vi.fn();
  self.from = vi.fn();
  self.where = vi.fn();
  self.orderBy = vi.fn();
  self.insert = vi.fn();
  self.values = vi.fn();
  self.update = vi.fn();
  self.set = vi.fn();
  self.delete = vi.fn();
  return { mockDb: self };
});

vi.mock('@/server/db', () => ({
  db: mockDb,
}));

function resetMockChain() {
  vi.clearAllMocks();
  Object.values(mockDb).forEach((fn) => fn.mockReturnThis());
}

import { findUserByEmail, findUserById, createUser, updateLastLogin } from '../user';

const mockUserRow = {
  id: 'usr_123',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://img.test/pic.jpg',
  registeredAt: '2025-01-01 00:00:00',
  lastLogin: '2025-01-02 00:00:00',
  isActive: true,
};

describe('user model', () => {
  beforeEach(() => {
    resetMockChain();
  });

  describe('findUserByEmail', () => {
    it('returns mapped user when found', async () => {
      mockDb.where.mockResolvedValueOnce([mockUserRow]);

      const result = await findUserByEmail('test@example.com');

      expect(result).toEqual({
        id: 'usr_123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://img.test/pic.jpg',
        registeredAt: '2025-01-01 00:00:00',
        lastLogin: '2025-01-02 00:00:00',
        isActive: true,
      });
    });

    it('returns undefined when not found', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await findUserByEmail('none@example.com');

      expect(result).toBeUndefined();
    });
  });

  describe('findUserById', () => {
    it('returns mapped user when found', async () => {
      mockDb.where.mockResolvedValueOnce([mockUserRow]);

      const result = await findUserById('usr_123');

      expect(result).toEqual({
        id: 'usr_123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://img.test/pic.jpg',
        registeredAt: '2025-01-01 00:00:00',
        lastLogin: '2025-01-02 00:00:00',
        isActive: true,
      });
    });

    it('returns undefined when not found', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await findUserById('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('createUser', () => {
    it('creates and returns user', async () => {
      mockDb.values.mockResolvedValueOnce(undefined);
      mockDb.where.mockResolvedValueOnce([mockUserRow]);

      const result = await createUser({
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result.id).toBe('usr_123');
    });

    it('passes picture when provided', async () => {
      mockDb.values.mockResolvedValueOnce(undefined);
      mockDb.where.mockResolvedValueOnce([mockUserRow]);

      await createUser({
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://img.test/pic.jpg',
      });

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({ picture: 'https://img.test/pic.jpg' }),
      );
    });

    it('throws when findUserById returns undefined after insert', async () => {
      mockDb.values.mockResolvedValueOnce(undefined);
      mockDb.where.mockResolvedValueOnce([]);

      await expect(
        createUser({ email: 'test@example.com', name: 'Test User' }),
      ).rejects.toThrow('Failed to create user');
    });
  });

  describe('updateLastLogin', () => {
    it('calls update with correct id', async () => {
      mockDb.where.mockResolvedValueOnce(undefined);

      await updateLastLogin('usr_123');

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ lastLogin: expect.any(String) }),
      );
    });
  });

  describe('mapRowToUser edge cases', () => {
    it('maps isActive false', async () => {
      mockDb.where.mockResolvedValueOnce([{ ...mockUserRow, isActive: false }]);

      const result = await findUserById('usr_123');

      expect(result?.isActive).toBe(false);
    });

    it('maps empty picture to undefined', async () => {
      mockDb.where.mockResolvedValueOnce([{ ...mockUserRow, picture: '' }]);

      const result = await findUserById('usr_123');

      expect(result?.picture).toBeUndefined();
    });
  });
});
