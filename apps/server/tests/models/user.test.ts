import { getTestDb, cleanupDb } from '../setup.js';
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateLastLogin,
} from '../../src/models/user.js';

vi.mock('../../src/lib/db.js', () => ({
  getDb: () => getTestDb(),
}));

beforeEach(() => {
  cleanupDb();
});

describe('findUserByEmail', () => {
  it('returns undefined for non-existent email', () => {
    const result = findUserByEmail('nobody@example.com');
    expect(result).toBeUndefined();
  });

  it('returns user for existing email', () => {
    const created = createUser({
      email: 'user-findemail@example.com',
      name: 'Test User',
    });

    const found = findUserByEmail('user-findemail@example.com');
    expect(found).toBeDefined();
    expect(found!.id).toBe(created.id);
    expect(found!.email).toBe('user-findemail@example.com');
    expect(found!.name).toBe('Test User');
  });
});

describe('findUserById', () => {
  it('returns undefined for non-existent id', () => {
    const result = findUserById('nonexistent');
    expect(result).toBeUndefined();
  });

  it('returns user for existing id', () => {
    const created = createUser({
      email: 'user-findbyid@example.com',
      name: 'Test User',
      picture: 'https://example.com/pic.jpg',
    });

    const found = findUserById(created.id);
    expect(found).toBeDefined();
    expect(found!.id).toBe(created.id);
    expect(found!.email).toBe('user-findbyid@example.com');
    expect(found!.name).toBe('Test User');
    expect(found!.picture).toBe('https://example.com/pic.jpg');
    expect(found!.isActive).toBe(true);
  });
});

describe('createUser', () => {
  it('creates user with crypto.randomUUID() id', () => {
    const result = createUser({
      email: 'user-create@example.com',
      name: 'New User',
    });

    expect(result).toBeDefined();
    expect(result.id).toMatch(/^usr_/);
    expect(result.email).toBe('user-create@example.com');
    expect(result.name).toBe('New User');
    expect(result.registeredAt).toBeDefined();
    expect(result.lastLogin).toBeDefined();
    expect(result.isActive).toBe(true);
  });

  it('creates user with optional picture', () => {
    const result = createUser({
      email: 'user-pic@example.com',
      name: 'Pic User',
      picture: 'https://example.com/avatar.jpg',
    });

    expect(result.picture).toBe('https://example.com/avatar.jpg');
  });

  it('creates user without picture as undefined', () => {
    const result = createUser({
      email: 'user-nopic@example.com',
      name: 'No Pic User',
    });

    expect(result.picture).toBeUndefined();
  });
});

describe('updateLastLogin', () => {
  it('updates last_login timestamp', () => {
    const created = createUser({
      email: 'user-login@example.com',
      name: 'Test User',
    });
    const originalLogin = created.lastLogin;

    updateLastLogin(created.id);

    const updated = findUserById(created.id);
    expect(updated!.lastLogin).toBeDefined();
    expect(updated!.lastLogin >= originalLogin).toBe(true);
  });
});
